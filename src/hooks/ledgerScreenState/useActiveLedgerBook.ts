import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { AppMessages } from "../../constants/messages";
import { isMissingUserRecordError } from "../../lib/auth/missingUserRecordError";
import { signOutFromApp } from "../../lib/auth/signOut";
import {
  createOwnedLedgerBook,
  fetchAccessibleLedgerBooks,
  fetchActiveLedgerBook,
  fetchLedgerBookById,
  leaveActiveLedgerBook,
  removeMemberFromActiveLedgerBook,
  requestLedgerBookJoinByCode,
  switchActiveLedgerBook,
  updateActiveLedgerBookName,
} from "../../lib/ledgerBooks";
import { logAppError } from "../../lib/logAppError";
import {
  clearSharedLedgerExitIntent,
  markSharedLedgerExitIntent,
} from "../../lib/sharedLedgerExitIntent";
import { resolveSharedLedgerJoinErrorMessage } from "../../lib/sharedLedgerJoinError";
import { supabase } from "../../lib/supabase";
import type { AccessibleLedgerBook, LedgerBook } from "../../types/ledgerBook";
import type { JoinSharedLedgerBookAttempt } from "../../types/ledgerBookJoinRequest";
import type { LedgerBookRow, ProfileRow } from "../../types/supabase";
import { mapLedgerBookRow } from "../../utils/ledgerBookMapper";
import type { BusyTaskTracker } from "./types";

let realtimeChannelSequence = 0;

function createRealtimeChannelName(prefix: string, identifier: string) {
  realtimeChannelSequence += 1;
  return `${prefix}-${identifier}-${realtimeChannelSequence}`;
}

type ActiveLedgerBookState = {
  activeBook: LedgerBook | null;
  activeBookError: string | null;
  accessibleBooks: AccessibleLedgerBook[];
  createLedgerBook: (nextName: string) => Promise<boolean>;
  isLoadingBook: boolean;
  joinSharedLedgerBookByCode: (shareCode: string) => Promise<JoinSharedLedgerBookAttempt>;
  leaveSharedLedgerBook: () => Promise<boolean>;
  removeSharedLedgerMember: (targetUserId: string) => Promise<boolean>;
  renameActiveLedgerBook: (nextName: string) => Promise<boolean>;
  refreshSharedLedgerBook: () => Promise<void>;
  switchLedgerBook: (bookId: string) => Promise<boolean>;
};

export function useActiveLedgerBook(
  userId: string,
  trackBusyTask: BusyTaskTracker,
): ActiveLedgerBookState {
  const [activeBook, setActiveBook] = useState<LedgerBook | null>(null);
  const [accessibleBooks, setAccessibleBooks] = useState<AccessibleLedgerBook[]>([]);
  const [activeBookError, setActiveBookError] = useState<string | null>(null);
  const [isLoadingBook, setIsLoadingBook] = useState(true);

  const loadActiveBook = async () => {
    setIsLoadingBook(true);
    setActiveBookError(null);

    try {
      const nextBook = await fetchActiveLedgerBook(userId);
      setActiveBook(nextBook);
      setAccessibleBooks(await fetchAccessibleLedgerBooks());
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
        const nextBooks = await fetchAccessibleLedgerBooks();
        if (isMounted) {
          setActiveBook(nextBook);
          setAccessibleBooks(nextBooks);
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
        const nextBooks = await fetchAccessibleLedgerBooks();
        if (isMounted) {
          setActiveBook(nextBook);
          setAccessibleBooks(nextBooks);
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
      .channel(createRealtimeChannelName("profile", userId))
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

  useEffect(() => {
    if (!activeBook?.id) {
      return;
    }

    const channel = supabase
      .channel(createRealtimeChannelName("ledger-book", activeBook.id))
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "ledger_books",
          filter: `id=eq.${activeBook.id}`,
        },
        (payload) => {
          const changedBook = payload.new as LedgerBookRow;
          setActiveBook(mapLedgerBookRow(changedBook));
          setAccessibleBooks((currentBooks) =>
            currentBooks.map((book) =>
              book.id === changedBook.id ? { ...book, ...mapLedgerBookRow(changedBook) } : book,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeBook?.id]);

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
        setAccessibleBooks(await fetchAccessibleLedgerBooks());
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
      setAccessibleBooks(await fetchAccessibleLedgerBooks());
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

  const renameActiveLedgerBook = async (nextName: string) => {
    setActiveBookError(null);

    try {
      const nextBook = await trackBusyTask(() => updateActiveLedgerBookName(nextName));
      setActiveBook(nextBook);
      setAccessibleBooks((currentBooks) =>
        currentBooks.map((book) => (book.id === nextBook.id ? { ...book, ...nextBook } : book)),
      );
      return true;
    } catch (error) {
      logAppError("ActiveLedgerBook", error, {
        activeBookId: activeBook?.id ?? null,
        nextName,
        step: "rename_active_ledger_book",
        userId,
      });
      return false;
    }
  };

  const refreshSharedLedgerBook = async () => {
    await trackBusyTask(loadActiveBook);
  };

  const createLedgerBook = async (nextName: string) => {
    setActiveBookError(null);
    const previousBook = activeBook;
    setActiveBook(null);

    try {
      const nextBook = await trackBusyTask(() => createOwnedLedgerBook(nextName));
      setActiveBook(nextBook);
      setAccessibleBooks(await fetchAccessibleLedgerBooks());
      return true;
    } catch (error) {
      setActiveBook(previousBook);
      logAppError("ActiveLedgerBook", error, {
        nextName,
        step: "create_ledger_book",
        userId,
      });
      return false;
    }
  };

  const switchLedgerBook = async (bookId: string) => {
    if (bookId === activeBook?.id) {
      return true;
    }

    setActiveBookError(null);
    const previousBook = activeBook;
    setActiveBook(null);

    try {
      const nextBook = await trackBusyTask(() => switchActiveLedgerBook(bookId));
      setActiveBook(nextBook);
      setAccessibleBooks(await fetchAccessibleLedgerBooks());
      return true;
    } catch (error) {
      setActiveBook(previousBook);
      logAppError("ActiveLedgerBook", error, {
        bookId,
        step: "switch_ledger_book",
        userId,
      });
      return false;
    }
  };

  return {
    activeBook,
    activeBookError,
    accessibleBooks,
    createLedgerBook,
    isLoadingBook,
    joinSharedLedgerBookByCode,
    leaveSharedLedgerBook,
    removeSharedLedgerMember,
    renameActiveLedgerBook,
    refreshSharedLedgerBook,
    switchLedgerBook,
  };
}
