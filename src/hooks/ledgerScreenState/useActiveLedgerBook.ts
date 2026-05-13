import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { AppMessages } from "../../constants/messages";
import { isMissingUserRecordError } from "../../lib/auth/missingUserRecordError";
import { signOutFromApp } from "../../lib/auth/signOut";
import {
  createOwnedLedgerBook,
  deleteOwnedLedgerBook,
  fetchAccessibleLedgerBookState,
  fetchAccessibleLedgerBooks,
  fetchActiveLedgerBook,
  fetchLedgerBookById,
  leaveActiveLedgerBook,
  previewLedgerBookJoinByCode,
  removeMemberFromActiveLedgerBook,
  requestLedgerBookJoinByCode,
  switchActiveLedgerBook,
  updateActiveLedgerBookName,
} from "../../lib/ledgerBooks";
import { logAppError } from "../../lib/logAppError";
import { createPerformanceTrace } from "../../lib/performanceTrace";
import {
  clearSharedLedgerExitIntent,
  markSharedLedgerExitIntent,
} from "../../lib/sharedLedgerExitIntent";
import { resolveSharedLedgerJoinErrorMessage } from "../../lib/sharedLedgerJoinError";
import { supabase } from "../../lib/supabase";
import type { AccessibleLedgerBook, LedgerBook } from "../../types/ledgerBook";
import type {
  JoinSharedLedgerBookAttempt,
  JoinSharedLedgerBookPreview,
  JoinSharedLedgerBookResolution,
} from "../../types/ledgerBookJoinRequest";
import type { LedgerBookMemberRow, LedgerBookRow, ProfileRow } from "../../types/supabase";
import { mapLedgerBookRow } from "../../utils/ledgerBookMapper";
import type { BusyTaskTracker } from "./types";

let realtimeChannelSequence = 0;

function createRealtimeChannelName(prefix: string, identifier: string) {
  realtimeChannelSequence += 1;
  return `${prefix}-${identifier}-${realtimeChannelSequence}`;
}

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
  joinSharedLedgerBookByCode: (
    shareCode: string,
    joinResolution?: JoinSharedLedgerBookResolution,
  ) => Promise<JoinSharedLedgerBookAttempt>;
  leaveSharedLedgerBook: () => Promise<boolean>;
  previewSharedLedgerBookJoinByCode: (shareCode: string) => Promise<JoinSharedLedgerBookPreview>;
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

      try {
        const { nextActiveBook, nextBooks } = await fetchLedgerBookState(userId);
        if (isMounted) {
          setActiveBook(nextActiveBook);
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

  useEffect(() => {
    let isMounted = true;

    const handleMembershipChange = async (
      payload: RealtimePostgresChangesPayload<LedgerBookMemberRow>,
    ) => {
      const changedMembership =
        payload.eventType === "DELETE"
          ? (payload.old as Partial<LedgerBookMemberRow>)
          : (payload.new as Partial<LedgerBookMemberRow>);
      const changedBookId = changedMembership.book_id;
      if (!changedBookId) {
        return;
      }

      if (payload.eventType === "DELETE") {
        setAccessibleBooks((currentBooks) =>
          currentBooks.filter((book) => book.id !== changedBookId),
        );
      }

      try {
        const nextBooks = await fetchAccessibleLedgerBooks();
        const shouldRefreshActiveBook =
          !activeBook ||
          changedBookId === activeBook.id ||
          !nextBooks.some((book) => book.id === activeBook.id);
        const nextActiveBook = shouldRefreshActiveBook
          ? await fetchActiveLedgerBook(userId)
          : activeBook;

        if (isMounted) {
          setAccessibleBooks(nextBooks);
          setActiveBook(nextActiveBook);
        }
      } catch (error) {
        if (payload.eventType === "DELETE" && isPermissionDeniedAccessibleLedgerBooksError(error)) {
          return;
        }

        logAppError("ActiveLedgerBook", error, {
          changedBookId,
          eventType: payload.eventType,
          step: "handle_membership_change",
          userId,
        });
        if (isMounted) {
          setActiveBookError(AppMessages.ledgerError);
        }
      }
    };

    const channel = supabase
      .channel(createRealtimeChannelName("ledger-book-membership", userId))
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ledger_book_members",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          void handleMembershipChange(
            payload as RealtimePostgresChangesPayload<LedgerBookMemberRow>,
          );
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [activeBook, userId]);

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
    activeBook,
    activeBookError,
    accessibleBooks,
    createLedgerBook,
    deleteActiveLedgerBook,
    isLoadingBook,
    joinSharedLedgerBookByCode,
    leaveSharedLedgerBook,
    previewSharedLedgerBookJoinByCode,
    removeSharedLedgerMember,
    renameActiveLedgerBook,
    refreshSharedLedgerBook,
    switchLedgerBook,
  };
}

function isInaccessibleLedgerBookError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { message?: string | null };
  return Boolean(candidate.message?.includes("is not accessible to user"));
}

function isPermissionDeniedAccessibleLedgerBooksError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: string | null; message?: string | null };
  return (
    candidate.code === "42501" &&
    candidate.message?.includes("permission denied for function get_accessible_ledger_books") ===
      true
  );
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
