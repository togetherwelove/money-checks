import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  approveLedgerBookJoinRequest,
  fetchPendingLedgerBookJoinRequestCounts,
  fetchPendingLedgerBookJoinRequests,
  rejectLedgerBookJoinRequest,
} from "../../lib/ledgerBooks";
import { resolveSharedLedgerJoinErrorMessage } from "../../lib/sharedLedgerJoinError";
import { supabase } from "../../lib/supabase";
import type { AccessibleLedgerBook, LedgerBook } from "../../types/ledgerBook";
import type {
  LedgerBookJoinApprovalAttempt,
  LedgerBookJoinRequest,
  LedgerBookJoinRequestCountByBookId,
} from "../../types/ledgerBookJoinRequest";
import type { LedgerBookJoinRequestRow } from "../../types/supabase";
import type { BusyTaskTracker } from "./types";

type LedgerJoinRequestsState = {
  approveLedgerJoinRequest: (requestId: string) => Promise<LedgerBookJoinApprovalAttempt>;
  pendingJoinRequestCountsByBookId: LedgerBookJoinRequestCountByBookId;
  pendingJoinRequests: LedgerBookJoinRequest[];
  rejectLedgerJoinRequest: (requestId: string) => Promise<boolean>;
};

export function useLedgerJoinRequests(
  activeBook: LedgerBook | null,
  accessibleBooks: AccessibleLedgerBook[],
  userId: string,
  trackBusyTask: BusyTaskTracker,
): LedgerJoinRequestsState {
  const [pendingJoinRequests, setPendingJoinRequests] = useState<LedgerBookJoinRequest[]>([]);
  const [pendingJoinRequestCountsByBookId, setPendingJoinRequestCountsByBookId] =
    useState<LedgerBookJoinRequestCountByBookId>({});
  const seenRequestIdsRef = useRef<Set<string>>(new Set());
  const canManageJoinRequests = Boolean(activeBook && activeBook.ownerId === userId);
  const ownedBookIds = useMemo(
    () => accessibleBooks.filter((book) => book.ownerId === userId).map((book) => book.id),
    [accessibleBooks, userId],
  );
  const ownedBookIdsKey = ownedBookIds.join("|");

  useEffect(() => {
    let isMounted = true;

    const loadPendingJoinRequests = async () => {
      if (!activeBook || !canManageJoinRequests) {
        seenRequestIdsRef.current = new Set();
        setPendingJoinRequests([]);
        return;
      }

      try {
        const nextRequests = await fetchPendingLedgerBookJoinRequests(activeBook.id);
        if (!isMounted) {
          return;
        }

        setPendingJoinRequests(nextRequests);
        seenRequestIdsRef.current = new Set(nextRequests.map((request) => request.id));
      } catch {
        if (isMounted) {
          setPendingJoinRequests([]);
        }
      }
    };

    void loadPendingJoinRequests();

    if (!activeBook || !canManageJoinRequests) {
      return () => {
        isMounted = false;
      };
    }

    const channel = supabase
      .channel(`ledger-book-join-requests-${activeBook.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ledger_book_join_requests",
          filter: `book_id=eq.${activeBook.id}`,
        },
        (payload) => {
          void handleJoinRequestChange(
            payload as RealtimePostgresChangesPayload<Record<string, unknown>>,
          );
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [activeBook, canManageJoinRequests]);

  useEffect(() => {
    let isMounted = true;
    const targetBookIds = ownedBookIdsKey ? ownedBookIdsKey.split("|") : [];

    const loadPendingJoinRequestCounts = async () => {
      if (targetBookIds.length === 0) {
        setPendingJoinRequestCountsByBookId({});
        return;
      }

      try {
        const nextCounts = await fetchPendingLedgerBookJoinRequestCounts(targetBookIds);
        if (isMounted) {
          setPendingJoinRequestCountsByBookId(nextCounts);
        }
      } catch {
        if (isMounted) {
          setPendingJoinRequestCountsByBookId({});
        }
      }
    };

    void loadPendingJoinRequestCounts();

    if (targetBookIds.length === 0) {
      return () => {
        isMounted = false;
      };
    }

    const channels = targetBookIds.map((bookId) =>
      supabase
        .channel(`ledger-book-join-request-counts-${bookId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "ledger_book_join_requests",
            filter: `book_id=eq.${bookId}`,
          },
          () => {
            void loadPendingJoinRequestCounts();
          },
        )
        .subscribe(),
    );

    return () => {
      isMounted = false;
      for (const channel of channels) {
        void supabase.removeChannel(channel);
      }
    };
  }, [ownedBookIdsKey]);

  const approveLedgerJoinRequest = async (requestId: string) => {
    try {
      await trackBusyTask(() => approveLedgerBookJoinRequest(requestId));
      seenRequestIdsRef.current.delete(requestId);
      decrementPendingJoinRequestCount(activeBook?.id ?? null);
      setPendingJoinRequests((currentRequests) =>
        currentRequests.filter((request) => request.id !== requestId),
      );
      return { didApprove: true, errorMessage: null };
    } catch (error) {
      return {
        didApprove: false,
        errorMessage: resolveSharedLedgerJoinErrorMessage(error),
      };
    }
  };

  const rejectLedgerJoinRequest = async (requestId: string) => {
    try {
      await trackBusyTask(() => rejectLedgerBookJoinRequest(requestId));
      seenRequestIdsRef.current.delete(requestId);
      decrementPendingJoinRequestCount(activeBook?.id ?? null);
      setPendingJoinRequests((currentRequests) =>
        currentRequests.filter((request) => request.id !== requestId),
      );
      return true;
    } catch {
      return false;
    }
  };

  return {
    approveLedgerJoinRequest,
    pendingJoinRequestCountsByBookId,
    pendingJoinRequests,
    rejectLedgerJoinRequest,
  };

  function decrementPendingJoinRequestCount(bookId: string | null) {
    if (!bookId) {
      return;
    }

    setPendingJoinRequestCountsByBookId((currentCounts) => ({
      ...currentCounts,
      [bookId]: Math.max((currentCounts[bookId] ?? 0) - 1, 0),
    }));
  }

  async function handleJoinRequestChange(
    payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
  ) {
    if (!activeBook) {
      return;
    }

    if (payload.eventType === "DELETE") {
      const deletedRequestId = typeof payload.old.id === "string" ? payload.old.id : null;
      if (!deletedRequestId) {
        return;
      }

      seenRequestIdsRef.current.delete(deletedRequestId);
      setPendingJoinRequests((currentRequests) =>
        currentRequests.filter((request) => request.id !== deletedRequestId),
      );
      return;
    }

    const changedRequest = payload.new as LedgerBookJoinRequestRow;
    if (changedRequest.status !== "pending") {
      seenRequestIdsRef.current.delete(changedRequest.id);
      setPendingJoinRequests((currentRequests) =>
        currentRequests.filter((request) => request.id !== changedRequest.id),
      );
      return;
    }

    try {
      const nextRequests = await fetchPendingLedgerBookJoinRequests(activeBook.id);
      setPendingJoinRequests(nextRequests);
      seenRequestIdsRef.current = new Set(nextRequests.map((request) => request.id));
    } catch {
      seenRequestIdsRef.current.add(changedRequest.id);
    }
  }
}
