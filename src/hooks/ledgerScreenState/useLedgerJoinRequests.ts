import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";

import {
  approveLedgerBookJoinRequest,
  fetchPendingLedgerBookJoinRequests,
  rejectLedgerBookJoinRequest,
} from "../../lib/ledgerBooks";
import { resolveSharedLedgerJoinErrorMessage } from "../../lib/sharedLedgerJoinError";
import { supabase } from "../../lib/supabase";
import type { LedgerBook } from "../../types/ledgerBook";
import type {
  LedgerBookJoinApprovalAttempt,
  LedgerBookJoinRequest,
} from "../../types/ledgerBookJoinRequest";
import type { LedgerBookJoinRequestRow } from "../../types/supabase";
import type { BusyTaskTracker } from "./types";

type LedgerJoinRequestsState = {
  approveLedgerJoinRequest: (requestId: string) => Promise<LedgerBookJoinApprovalAttempt>;
  pendingJoinRequests: LedgerBookJoinRequest[];
  rejectLedgerJoinRequest: (requestId: string) => Promise<boolean>;
};

export function useLedgerJoinRequests(
  activeBook: LedgerBook | null,
  userId: string,
  trackBusyTask: BusyTaskTracker,
): LedgerJoinRequestsState {
  const [pendingJoinRequests, setPendingJoinRequests] = useState<LedgerBookJoinRequest[]>([]);
  const seenRequestIdsRef = useRef<Set<string>>(new Set());
  const canManageJoinRequests = Boolean(activeBook && activeBook.ownerId === userId);

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

  const approveLedgerJoinRequest = async (requestId: string) => {
    try {
      await trackBusyTask(() => approveLedgerBookJoinRequest(requestId));
      seenRequestIdsRef.current.delete(requestId);
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
    pendingJoinRequests,
    rejectLedgerJoinRequest,
  };

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
