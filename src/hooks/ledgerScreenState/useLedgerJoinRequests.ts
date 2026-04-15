import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";

import { DEFAULT_MEMBER_DISPLAY_NAME } from "../../constants/ledgerDisplay";
import {
  approveLedgerBookJoinRequest,
  fetchPendingLedgerBookJoinRequests,
  rejectLedgerBookJoinRequest,
} from "../../lib/ledgerBooks";
import { fetchProfileDisplayName } from "../../lib/profiles";
import { supabase } from "../../lib/supabase";
import type { LedgerBook } from "../../types/ledgerBook";
import type { LedgerBookJoinRequest } from "../../types/ledgerBookJoinRequest";
import type { LedgerBookJoinRequestRow } from "../../types/supabase";
import type { BusyTaskTracker } from "./types";

type LedgerJoinRequestsState = {
  approveLedgerJoinRequest: (requestId: string) => Promise<boolean>;
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
      return true;
    } catch {
      return false;
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

    let requesterDisplayName = DEFAULT_MEMBER_DISPLAY_NAME;
    try {
      requesterDisplayName =
        (await fetchProfileDisplayName(changedRequest.requester_user_id)).trim() ||
        DEFAULT_MEMBER_DISPLAY_NAME;
    } catch {
      requesterDisplayName = DEFAULT_MEMBER_DISPLAY_NAME;
    }

    const nextRequest: LedgerBookJoinRequest = {
      id: changedRequest.id,
      requestedAt: changedRequest.created_at,
      requesterDisplayName,
      requesterUserId: changedRequest.requester_user_id,
    };

    setPendingJoinRequests((currentRequests) => upsertJoinRequest(currentRequests, nextRequest));
    seenRequestIdsRef.current.add(changedRequest.id);
  }
}

function upsertJoinRequest(
  currentRequests: LedgerBookJoinRequest[],
  nextRequest: LedgerBookJoinRequest,
): LedgerBookJoinRequest[] {
  const nextRequests = currentRequests.some((request) => request.id === nextRequest.id)
    ? currentRequests.map((request) => (request.id === nextRequest.id ? nextRequest : request))
    : [...currentRequests, nextRequest];

  return [...nextRequests].sort((left, right) => left.requestedAt.localeCompare(right.requestedAt));
}
