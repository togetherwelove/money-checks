import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { AppMessages } from "../../constants/messages";
import { isMissingUserRecordError } from "../../lib/auth/missingUserRecordError";
import { signOutFromApp } from "../../lib/auth/signOut";
import {
  fetchActiveLedgerBook,
  fetchLedgerBookById,
  leaveActiveLedgerBook,
  removeMemberFromActiveLedgerBook,
  requestLedgerBookJoinByCode,
} from "../../lib/ledgerBooks";
import { logAppError } from "../../lib/logAppError";
import {
  clearSharedLedgerExitIntent,
  markSharedLedgerExitIntent,
} from "../../lib/sharedLedgerExitIntent";
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
    } catch (error) {
      logAppError("ActiveLedgerBook", error, { step: "refresh_active_book", userId });
      if (isMissingUserRecordError(error)) {
        await signOutFromApp();
        return;
      }
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
      } catch (error) {
        logAppError("ActiveLedgerBook", error, { step: "load_active_book", userId });
        if (isMissingUserRecordError(error)) {
          await signOutFromApp();
          return;
        }
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
      } catch (error) {
        logAppError("ActiveLedgerBook", error, {
          nextActiveBookId,
          step: "handle_profile_change",
          userId,
        });
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
        book: null,
        errorMessage: resolveSharedLedgerJoinErrorMessage({
          message: "Ledger book not found for code",
        }),
        result: null,
      };
    }

    setActiveBookError(null);

    try {
      const joinResult = await trackBusyTask(() => requestLedgerBookJoinByCode(normalizedCode));
      let joinedBook: LedgerBook | null = null;
      if (joinResult === "joined") {
        joinedBook = await fetchActiveLedgerBook(userId);
        setActiveBook(joinedBook);
      }

      return {
        book: joinedBook,
        errorMessage: null,
        result: joinResult,
      };
    } catch (error) {
      logAppError("ActiveLedgerBook", error, {
        shareCode: normalizedCode,
        step: "join_shared_ledger_book",
        userId,
      });
      const errorMessage = resolveSharedLedgerJoinErrorMessage(error);
      setActiveBookError(errorMessage);
      return {
        book: null,
        errorMessage,
        result: null,
      };
    }
  };

  const leaveSharedLedgerBook = async () => {
    setActiveBookError(null);
    const shouldTrackExitIntent = Boolean(activeBook && activeBook.ownerId !== userId);
    if (shouldTrackExitIntent && activeBook) {
      markSharedLedgerExitIntent(userId, activeBook.id);
    }

    try {
      const nextBook = await trackBusyTask(async () => {
        await leaveActiveLedgerBook();
        return fetchActiveLedgerBook(userId);
      });
      setActiveBook(nextBook);
      return Boolean(nextBook);
    } catch (error) {
      logAppError("ActiveLedgerBook", error, {
        activeBookId: activeBook?.id ?? null,
        step: "leave_shared_ledger_book",
        userId,
      });
      if (shouldTrackExitIntent && activeBook) {
        clearSharedLedgerExitIntent(userId, activeBook.id);
      }
      setActiveBookError(AppMessages.accountDisconnectError);
      return false;
    }
  };

  const removeSharedLedgerMember = async (targetUserId: string) => {
    setActiveBookError(null);

    try {
      await trackBusyTask(() => removeMemberFromActiveLedgerBook(targetUserId));
      return true;
    } catch (error) {
      logAppError("ActiveLedgerBook", error, {
        step: "remove_shared_ledger_member",
        targetUserId,
        userId,
      });
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
