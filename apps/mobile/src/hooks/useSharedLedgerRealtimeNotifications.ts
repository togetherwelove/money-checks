import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useEffect, useRef } from "react";

import { DEFAULT_MEMBER_DISPLAY_NAME } from "../constants/ledgerDisplay";
import { fetchProfileDisplayName } from "../lib/profiles";
import { consumeSharedLedgerExitIntent } from "../lib/sharedLedgerExitIntent";
import { supabase } from "../lib/supabase";
import {
  createMemberJoinedBookEvent,
  createMemberLeftBookEvent,
  createMemberRemovedFromBookEvent,
  createOtherMemberCreatedEntryEvent,
  createOtherMemberDeletedEntryEvent,
  createOtherMemberUpdatedEntryEvent,
} from "../notifications/domain/notificationEventFactories";
import type { NotificationEvent } from "../notifications/domain/notificationEvents";
import type { LedgerEntry } from "../types/ledger";
import type { LedgerBook } from "../types/ledgerBook";
import type { LedgerBookMemberRow, LedgerEntryRow } from "../types/supabase";
import { mapLedgerEntryRow } from "../utils/ledgerMapper";

type SharedLedgerRealtimeNotificationsProps = {
  activeBook: LedgerBook | null;
  currentUserId: string;
  entries: LedgerEntry[];
  notifyLedgerEvent: (event: NotificationEvent) => Promise<void>;
};

export function useSharedLedgerRealtimeNotifications({
  activeBook,
  currentUserId,
  entries,
  notifyLedgerEvent,
}: SharedLedgerRealtimeNotificationsProps) {
  const entriesRef = useRef(entries);
  const notifyLedgerEventRef = useRef(notifyLedgerEvent);

  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  useEffect(() => {
    notifyLedgerEventRef.current = notifyLedgerEvent;
  }, [notifyLedgerEvent]);

  useEffect(() => {
    if (!activeBook) {
      return;
    }

    const currentBook = activeBook;
    const entryChannel = supabase
      .channel(`shared-ledger-notifications-entries-${currentBook.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ledger_entries",
          filter: `book_id=eq.${currentBook.id}`,
        },
        (payload) => {
          void handleEntryChange(
            payload as RealtimePostgresChangesPayload<Record<string, unknown>>,
          );
        },
      )
      .subscribe();

    const memberChannel = supabase
      .channel(`shared-ledger-notifications-members-${currentBook.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ledger_book_members",
          filter: `book_id=eq.${currentBook.id}`,
        },
        (payload) => {
          void handleMemberChange(
            payload as RealtimePostgresChangesPayload<Record<string, unknown>>,
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(entryChannel);
      void supabase.removeChannel(memberChannel);
    };

    async function handleEntryChange(
      payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
    ) {
      if (payload.eventType === "DELETE") {
        const deletedEntryId = typeof payload.old.id === "string" ? payload.old.id : null;
        const deletedUserId = typeof payload.old.user_id === "string" ? payload.old.user_id : null;
        if (!deletedEntryId || !deletedUserId || deletedUserId === currentUserId) {
          return;
        }

        const deletedEntry = entriesRef.current.find((entry) => entry.id === deletedEntryId);
        if (!deletedEntry) {
          return;
        }

        const actorName = await resolveDisplayName(deletedUserId, deletedEntry.authorName);
        await notifyLedgerEventRef.current(
          createOtherMemberDeletedEntryEvent(
            { actorName, bookName: currentBook.name },
            { ...deletedEntry, authorId: deletedUserId, authorName: actorName },
          ),
        );
        return;
      }

      const changedRow = payload.new as LedgerEntryRow;
      if (changedRow.user_id === currentUserId) {
        return;
      }

      const actorName = await resolveDisplayName(changedRow.user_id);
      const nextEntry = mapLedgerEntryRow(changedRow, actorName);
      const sharedContext = { actorName, bookName: currentBook.name };

      if (payload.eventType === "INSERT") {
        await notifyLedgerEventRef.current(
          createOtherMemberCreatedEntryEvent(sharedContext, nextEntry),
        );
        return;
      }

      await notifyLedgerEventRef.current(
        createOtherMemberUpdatedEntryEvent(sharedContext, nextEntry),
      );
    }

    async function handleMemberChange(
      payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
    ) {
      if (payload.eventType === "INSERT") {
        const insertedMember = payload.new as LedgerBookMemberRow;
        if (insertedMember.user_id === currentUserId) {
          return;
        }

        const actorName = await resolveDisplayName(insertedMember.user_id);
        await notifyLedgerEventRef.current(
          createMemberJoinedBookEvent(actorName, currentBook.name),
        );
        return;
      }

      if (payload.eventType !== "DELETE") {
        return;
      }

      const deletedUserId = typeof payload.old.user_id === "string" ? payload.old.user_id : null;
      if (!deletedUserId) {
        return;
      }

      if (deletedUserId === currentUserId) {
        if (consumeSharedLedgerExitIntent(currentUserId, currentBook.id)) {
          return;
        }

        const actorName = await resolveDisplayName(currentBook.ownerId);
        await notifyLedgerEventRef.current(
          createMemberRemovedFromBookEvent(actorName, currentBook.name),
        );
        return;
      }

      const actorName = await resolveDisplayName(deletedUserId);
      await notifyLedgerEventRef.current(createMemberLeftBookEvent(actorName, currentBook.name));
    }
  }, [activeBook, currentUserId]);
}

async function resolveDisplayName(userId: string, fallbackName?: string): Promise<string> {
  if (fallbackName?.trim()) {
    return fallbackName.trim();
  }

  try {
    return (await fetchProfileDisplayName(userId)).trim() || DEFAULT_MEMBER_DISPLAY_NAME;
  } catch {
    return DEFAULT_MEMBER_DISPLAY_NAME;
  }
}
