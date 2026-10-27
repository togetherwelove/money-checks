import type { Dispatch, SetStateAction } from "react";

import { AppMessages } from "../../constants/messages";
import {
  createOwnedLedgerBook,
  deleteOwnedLedgerBook,
  fetchAccessibleLedgerBooks,
  fetchActiveLedgerBook,
  fetchLedgerBookById,
  leaveActiveLedgerBook,
  previewLedgerBookJoinByCode,
  refreshActiveLedgerBookShareCodeIfExpired,
  removeMemberFromActiveLedgerBook,
  requestLedgerBookJoinByCode,
  switchActiveLedgerBook,
  transferActiveLedgerBookOwnership,
  updateActiveLedgerBookName,
} from "../../lib/ledgerBooks";
import { logAppError } from "../../lib/logAppError";
import {
  clearSharedLedgerExitIntent,
  markSharedLedgerExitIntent,
} from "../../lib/sharedLedgerExitIntent";
import { resolveSharedLedgerJoinErrorMessage } from "../../lib/sharedLedgerJoinError";
import type { AccessibleLedgerBook, LedgerBook } from "../../types/ledgerBook";
import type {
  JoinSharedLedgerBookPreview,
  JoinSharedLedgerBookResolution,
} from "../../types/ledgerBookJoinRequest";
import type { BusyTaskTracker } from "./types";

type Options = {
  userId: string;
  activeBook: LedgerBook | null;
  trackBusyTask: BusyTaskTracker;
  setActiveBook: Dispatch<SetStateAction<LedgerBook | null>>;
  setAccessibleBooks: Dispatch<SetStateAction<AccessibleLedgerBook[]>>;
  setActiveBookError: Dispatch<SetStateAction<string | null>>;
  refreshAccessibleLedgerBookState: () => Promise<void>;
  loadActiveBook: () => Promise<void>;
};

export function createLedgerBookActions({
  userId,
  activeBook,
  trackBusyTask,
  setActiveBook,
  setAccessibleBooks,
  setActiveBookError,
  refreshAccessibleLedgerBookState,
  loadActiveBook,
}: Options) {
  const previewSharedLedgerBookJoinByCode = async (shareCode: string) => {
    const normalizedCode = shareCode.trim();
    if (!normalizedCode) {
      return {
        status: "invalid_code",
        targetBookId: null,
        targetBookName: null,
      } satisfies JoinSharedLedgerBookPreview;
    }

    return trackBusyTask(() => previewLedgerBookJoinByCode(normalizedCode));
  };

  const joinSharedLedgerBookByCode = async (
    shareCode: string,
    joinResolution?: JoinSharedLedgerBookResolution,
  ) => {
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
      const joinResult = await trackBusyTask(() =>
        requestLedgerBookJoinByCode(normalizedCode, joinResolution),
      );
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
      if (__DEV__) {
        throw createDebugLedgerJoinError(error);
      }

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

  const transferSharedLedgerOwnership = async (targetUserId: string) => {
    setActiveBookError(null);

    try {
      await trackBusyTask(async () => {
        await transferActiveLedgerBookOwnership(targetUserId);
        await refreshAccessibleLedgerBookState();
      });
      return true;
    } catch (error) {
      logAppError("ActiveLedgerBook", error, {
        activeBookId: activeBook?.id ?? null,
        step: "transfer_shared_ledger_ownership",
        targetUserId,
        userId,
      });
      setActiveBookError(AppMessages.accountTransferOwnershipError);
      return false;
    }
  };

  const renameActiveLedgerBook = async (nextName: string) => {
    if (!activeBook || activeBook.ownerId !== userId) {
      return false;
    }
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

  const refreshExpiredShareCode = async () => {
    try {
      const nextBook = await trackBusyTask(refreshActiveLedgerBookShareCodeIfExpired);
      setActiveBook(nextBook);
      setAccessibleBooks((currentBooks) =>
        currentBooks.map((book) => (book.id === nextBook.id ? { ...book, ...nextBook } : book)),
      );
    } catch (error) {
      logAppError("ActiveLedgerBook", error, {
        activeBookId: activeBook?.id ?? null,
        step: "refresh_expired_share_code",
        userId,
      });
    }
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

  const deleteActiveLedgerBook = async () => {
    if (!activeBook) {
      return false;
    }

    setActiveBookError(null);
    const previousBook = activeBook;
    setActiveBook(null);

    try {
      const fallbackBookId = await trackBusyTask(() => deleteOwnedLedgerBook(activeBook.id));
      const nextBook = await fetchLedgerBookById(fallbackBookId);
      setActiveBook(nextBook);
      setAccessibleBooks(await fetchAccessibleLedgerBooks());
      return true;
    } catch (error) {
      setActiveBook(previousBook);
      logAppError("ActiveLedgerBook", error, {
        activeBookId: activeBook.id,
        step: "delete_active_ledger_book",
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
      if (isInaccessibleLedgerBookError(error)) {
        await refreshAccessibleLedgerBookState().catch((refreshError) => {
          logAppError("ActiveLedgerBook", refreshError, {
            bookId,
            step: "refresh_after_inaccessible_switch",
            userId,
          });
          setActiveBook(previousBook);
        });
      } else {
        setActiveBook(previousBook);
      }
      logAppError("ActiveLedgerBook", error, {
        bookId,
        step: "switch_ledger_book",
        userId,
      });
      return false;
    }
  };

  return {
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
  };
}

function createDebugLedgerJoinError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (!error || typeof error !== "object") {
    return new Error(String(error));
  }

  const candidate = error as {
    code?: string | null;
    details?: string | null;
    hint?: string | null;
    message?: string | null;
  };
  const debugMessage = [
    candidate.message,
    candidate.details ? `details: ${candidate.details}` : null,
    candidate.hint ? `hint: ${candidate.hint}` : null,
    candidate.code ? `code: ${candidate.code}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return new Error(debugMessage || JSON.stringify(error));
}

function isInaccessibleLedgerBookError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { message?: string | null };
  return Boolean(candidate.message?.includes("is not accessible to user"));
}
