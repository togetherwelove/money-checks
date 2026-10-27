import { createLedgerBookActions } from "./ledgerBookActions";
import { useLedgerBookRealtime } from "./useLedgerBookRealtime";
import { useEffect, useState } from "react";

import { AppMessages } from "../../constants/messages";
import { isMissingUserRecordError } from "../../lib/auth/missingUserRecordError";
import { signOutFromApp } from "../../lib/auth/signOut";
import { fetchAccessibleLedgerBookState } from "../../lib/ledgerBooks";
import { fetchLedgerAppBootstrap } from "../../lib/ledgerAppBootstrap";
import { logAppError, logAppWarning } from "../../lib/logAppError";
import { createPerformanceTrace } from "../../lib/performanceTrace";
import type { LedgerEntry } from "../../types/ledger";
import type { AccessibleLedgerBook, LedgerBook } from "../../types/ledgerBook";
import type {
  JoinSharedLedgerBookAttempt,
  JoinSharedLedgerBookPreview,
  JoinSharedLedgerBookResolution,
} from "../../types/ledgerBookJoinRequest";
import { getMonthKey } from "../../utils/calendar";
import { getLedgerMonthEnd, getLedgerMonthStart } from "../../utils/ledgerMonthWindow";
import type { BusyTaskTracker } from "./types";

async function fetchLedgerBookState(userId: string): Promise<{
  nextActiveBook: LedgerBook | null;
  nextBooks: AccessibleLedgerBook[];
}> {
  const trace = createPerformanceTrace("ActiveLedgerBook", { step: "load_book_state", userId });
  const { activeBook: nextActiveBook, books: nextBooks } =
    await fetchAccessibleLedgerBookState(userId);

  trace("loaded_book_state", {
    activeBookId: nextActiveBook?.id ?? null,
    bookCount: nextBooks.length,
  });

  return { nextActiveBook, nextBooks };
}

type ActiveLedgerBookState = {
  activeBook: LedgerBook | null;
  activeBookError: string | null;
  accessibleBooks: AccessibleLedgerBook[];
  createLedgerBook: (nextName: string) => Promise<boolean>;
  deleteActiveLedgerBook: () => Promise<boolean>;
  isLoadingBook: boolean;
  initialEntryBootstrap: {
    bookId: string;
    entries: LedgerEntry[];
    month: Date;
  } | null;
  joinSharedLedgerBookByCode: (
    shareCode: string,
    joinResolution?: JoinSharedLedgerBookResolution,
  ) => Promise<JoinSharedLedgerBookAttempt>;
  leaveSharedLedgerBook: () => Promise<boolean>;
  previewSharedLedgerBookJoinByCode: (shareCode: string) => Promise<JoinSharedLedgerBookPreview>;
  refreshExpiredShareCode: () => Promise<void>;
  removeSharedLedgerMember: (targetUserId: string) => Promise<boolean>;
  renameActiveLedgerBook: (nextName: string) => Promise<boolean>;
  refreshSharedLedgerBook: () => Promise<void>;
  switchLedgerBook: (bookId: string) => Promise<boolean>;
  transferSharedLedgerOwnership: (targetUserId: string) => Promise<boolean>;
};

export function useActiveLedgerBook(
  userId: string,
  trackBusyTask: BusyTaskTracker,
  initialBootstrapMonth: Date,
): ActiveLedgerBookState {
  const [activeBook, setActiveBook] = useState<LedgerBook | null>(null);
  const [accessibleBooks, setAccessibleBooks] = useState<AccessibleLedgerBook[]>([]);
  const [activeBookError, setActiveBookError] = useState<string | null>(null);
  const [isLoadingBook, setIsLoadingBook] = useState(true);
  const [initialEntryBootstrap, setInitialEntryBootstrap] =
    useState<ActiveLedgerBookState["initialEntryBootstrap"]>(null);

  const refreshAccessibleLedgerBookState = async () => {
    const { nextActiveBook, nextBooks } = await fetchLedgerBookState(userId);
    setActiveBook(nextActiveBook);
    setAccessibleBooks(nextBooks);
  };

  const loadActiveBook = async () => {
    setIsLoadingBook(true);
    setActiveBookError(null);

    try {
      const { nextActiveBook, nextBooks } = await fetchLedgerBookState(userId);
      setActiveBook(nextActiveBook);
      setAccessibleBooks(nextBooks);
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
      setInitialEntryBootstrap(null);

      try {
        let nextActiveBook: LedgerBook | null;
        let nextBooks: AccessibleLedgerBook[];
        let nextInitialEntryBootstrap: ActiveLedgerBookState["initialEntryBootstrap"] = null;

        try {
          const bootstrap = await fetchLedgerAppBootstrap(
            userId,
            getLedgerMonthStart(initialBootstrapMonth),
            getLedgerMonthEnd(initialBootstrapMonth),
          );
          nextActiveBook = bootstrap.activeBook;
          nextBooks = bootstrap.books;
          nextInitialEntryBootstrap = {
            bookId: bootstrap.activeBook.id,
            entries: bootstrap.entries,
            month: initialBootstrapMonth,
          };
        } catch (bootstrapError) {
          logAppWarning("ActiveLedgerBook", "Falling back from ledger app bootstrap.", {
            error: bootstrapError,
            monthKey: getMonthKey(initialBootstrapMonth),
            step: "load_ledger_app_bootstrap",
            userId,
          });
          const bookState = await fetchLedgerBookState(userId);
          nextActiveBook = bookState.nextActiveBook;
          nextBooks = bookState.nextBooks;
        }

        if (isMounted) {
          setActiveBook(nextActiveBook);
          setAccessibleBooks(nextBooks);
          setInitialEntryBootstrap(nextInitialEntryBootstrap);
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
  }, [initialBootstrapMonth, userId]);

  useLedgerBookRealtime({
    userId,
    activeBook,
    setActiveBook,
    setAccessibleBooks,
    setActiveBookError,
  });

  const {
    previewSharedLedgerBookJoinByCode,
    joinSharedLedgerBookByCode,
    leaveSharedLedgerBook,
    removeSharedLedgerMember,
    transferSharedLedgerOwnership,
    renameActiveLedgerBook,
    refreshSharedLedgerBook,
    refreshExpiredShareCode,
    createLedgerBook,
    deleteActiveLedgerBook,
    switchLedgerBook,
  } = createLedgerBookActions({
    userId,
    activeBook,
    trackBusyTask,
    setActiveBook,
    setAccessibleBooks,
    setActiveBookError,
    refreshAccessibleLedgerBookState,
    loadActiveBook,
  });

  return {
    activeBook,
    activeBookError,
    accessibleBooks,
    createLedgerBook,
    deleteActiveLedgerBook,
    initialEntryBootstrap,
    isLoadingBook,
    joinSharedLedgerBookByCode,
    leaveSharedLedgerBook,
    previewSharedLedgerBookJoinByCode,
    refreshExpiredShareCode,
    removeSharedLedgerMember,
    renameActiveLedgerBook,
    refreshSharedLedgerBook,
    switchLedgerBook,
    transferSharedLedgerOwnership,
  };
}
