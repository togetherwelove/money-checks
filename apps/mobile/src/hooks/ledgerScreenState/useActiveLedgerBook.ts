import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { AppMessages } from "../../constants/messages";
import {
  fetchActiveLedgerBook,
  fetchLedgerBookById,
  leaveActiveLedgerBook,
  removeMemberFromActiveLedgerBook,
  requestLedgerBookJoinByCode,
} from "../../lib/ledgerBooks";
import { resolveSharedLedgerJoinErrorMessage } from "../../lib/sharedLedgerJoinError";
import { supabase } from "../../lib/supabase";
import type { LedgerBook } from "../../types/ledgerBook";
import type { JoinSharedLedgerBookAttempt } from "../../types/ledgerBookJoinRequest";
import type { ProfileRow } from "../../types/supabase";
import type { BusyTaskTracker } from "./types";

type ActiveLedgerBookState = {
  activeBook: LedgerBook | null;
  activeBookError: string | null;
  isLoadingBook: boolean;
  joinSharedLedgerBookByCode: (shareCode: string) => Promise<JoinSharedLedgerBookAttempt>;
  leaveSharedLedgerBook: () => Promise<boolean>;
  removeSharedLedgerMember: (targetUserId: string) => Promise<boolean>;
  refreshSharedLedgerBook: () => Promise<void>;
};

export function useActiveLedgerBook(
  userId: string,
  trackBusyTask: BusyTaskTracker,
): ActiveLedgerBookState {
  const [activeBook, setActiveBook] = useState<LedgerBook | null>(null);
  const [activeBookError, setActiveBookError] = useState<string | null>(null);
  const [isLoadingBook, setIsLoadingBook] = useState(true);

  const loadActiveBook = async () => {
    setIsLoadingBook(true);
    setActiveBookError(null);

    try {
      const nextBook = await fetchActiveLedgerBook(userId);
      setActiveBook(nextBook);
    } catch {
      setActiveBookError(AppMessages.ledgerError);
    } finally {
      setIsLoadingBook(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      setIsLoadingBook(true);
      setActiveBookError(null);

      try {
        const nextBook = await fetchActiveLedgerBook(userId);
        if (isMounted) {
          setActiveBook(nextBook);
        }
      } catch {
        if (isMounted) {
          setActiveBookError(AppMessages.ledgerError);
        }
      } finally {
        if (isMounted) {
          setIsLoadingBook(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  useEffect(() => {
    let isMounted = true;

    const handleProfileChange = async (payload: RealtimePostgresChangesPayload<ProfileRow>) => {
      const changedProfile = payload.new as ProfileRow;
      const nextActiveBookId = changedProfile.active_book_id;
      if (!nextActiveBookId) {
        if (isMounted) {
          setActiveBook(null);
        }
        return;
      }

      if (nextActiveBookId === activeBook?.id) {
        return;
      }

      try {
        const nextBook = await fetchLedgerBookById(nextActiveBookId);
        if (isMounted) {
          setActiveBook(nextBook);
        }
      } catch {
        if (isMounted) {
          setActiveBookError(AppMessages.ledgerError);
        }
      }
    };

    const channel = supabase
      .channel(`profile-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          void handleProfileChange(payload as RealtimePostgresChangesPayload<ProfileRow>);
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [activeBook?.id, userId]);

  const joinSharedLedgerBookByCode = async (shareCode: string) => {
    const normalizedCode = shareCode.trim();
    if (!normalizedCode) {
      return {
        errorMessage: resolveSharedLedgerJoinErrorMessage({
          message: "Ledger book not found for code",
        }),
        result: null,
      };
    }

    setActiveBookError(null);

    try {
      const joinResult = await trackBusyTask(() => requestLedgerBookJoinByCode(normalizedCode));
      if (joinResult === "joined") {
        const nextBook = await fetchActiveLedgerBook(userId);
        setActiveBook(nextBook);
      }

      return {
        errorMessage: null,
        result: joinResult,
      };
    } catch (error) {
      const errorMessage = resolveSharedLedgerJoinErrorMessage(error);
      setActiveBookError(errorMessage);
      return {
        errorMessage,
        result: null,
      };
    }
  };

  const leaveSharedLedgerBook = async () => {
    setActiveBookError(null);

    try {
      const nextBook = await trackBusyTask(async () => {
        await leaveActiveLedgerBook();
        return fetchActiveLedgerBook(userId);
      });
      setActiveBook(nextBook);
      return Boolean(nextBook);
    } catch {
      setActiveBookError(AppMessages.accountDisconnectError);
      return false;
    }
  };

  const removeSharedLedgerMember = async (targetUserId: string) => {
    setActiveBookError(null);

    try {
      await trackBusyTask(() => removeMemberFromActiveLedgerBook(targetUserId));
      return true;
    } catch {
      setActiveBookError(AppMessages.accountKickError);
      return false;
    }
  };

  const refreshSharedLedgerBook = async () => {
    await trackBusyTask(loadActiveBook);
  };

  return {
    activeBook,
    activeBookError,
    isLoadingBook,
    joinSharedLedgerBookByCode,
    leaveSharedLedgerBook,
    removeSharedLedgerMember,
    refreshSharedLedgerBook,
  };
}
