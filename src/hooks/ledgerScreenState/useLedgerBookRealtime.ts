import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useEffect, type Dispatch, type SetStateAction } from "react";
import { AppMessages } from "../../constants/messages";
import {
  fetchAccessibleLedgerBooks,
  fetchActiveLedgerBook,
  fetchLedgerBookById,
} from "../../lib/ledgerBooks";
import { logAppError } from "../../lib/logAppError";
import { supabase } from "../../lib/supabase";
import type { AccessibleLedgerBook, LedgerBook } from "../../types/ledgerBook";
import type { LedgerBookMemberRow, LedgerBookRow, ProfileRow } from "../../types/supabase";
import { mapLedgerBookRow } from "../../utils/ledgerBookMapper";

let realtimeChannelSequence = 0;

function createRealtimeChannelName(prefix: string, identifier: string) {
  realtimeChannelSequence += 1;
  return `${prefix}-${identifier}-${realtimeChannelSequence}`;
}

type Options = {
  userId: string;
  activeBook: LedgerBook | null;
  setActiveBook: Dispatch<SetStateAction<LedgerBook | null>>;
  setAccessibleBooks: Dispatch<SetStateAction<AccessibleLedgerBook[]>>;
  setActiveBookError: Dispatch<SetStateAction<string | null>>;
};

export function useLedgerBookRealtime({
  userId,
  activeBook,
  setActiveBook,
  setAccessibleBooks,
  setActiveBookError,
}: Options) {
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
