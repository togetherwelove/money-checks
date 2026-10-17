import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";

import { NotificationBadgeScopes } from "../constants/notificationBadges";
import { logAppError } from "../lib/logAppError";
import { markEntryNotificationsRead } from "../lib/notifications/entryNotificationReads";
import { dismissPresentedNotificationBadges } from "../lib/notifications/notificationBadges";
import type { LedgerScreenState } from "./useLedgerScreenState";

export function useEntryNotificationReads(
  isCalendarVisible: boolean,
  state: LedgerScreenState,
  refreshBadges: () => Promise<void>,
) {
  const activeReadsRef = useRef(new Set<string>());
  const markEntriesRead = useCallback(async (bookId: string, entryIds: readonly string[]) => {
    if (entryIds.length === 0) return;
    const readKey = JSON.stringify([bookId, ...entryIds]);
    if (activeReadsRef.current.has(readKey)) return;
    activeReadsRef.current.add(readKey);
    try {
      await markEntryNotificationsRead(bookId, entryIds);
      await refreshBadges();
      await dismissPresentedNotificationBadges(bookId, NotificationBadgeScopes.ledgerEntries, entryIds);
    } catch (error) {
      logAppError("NotificationBadges", error, {
        bookId,
        step: "mark_entry_notifications_read",
      });
    } finally {
      activeReadsRef.current.delete(readKey);
    }
  }, [refreshBadges]);

  const bookId = state.activeBook?.id;
  const { selectedDate, selectedEntries, isLoadingSelectedDateEntries, errorMessage } = state;
  useEffect(() => {
    const readDisplayedEntries = () => {
      if (
        AppState.currentState !== "active" || !isCalendarVisible || !bookId ||
        isLoadingSelectedDateEntries || errorMessage
      ) return;
      const entryIds = selectedEntries
        .filter((entry) => entry.date === selectedDate)
        .map((entry) => entry.id);
      void markEntriesRead(bookId, entryIds);
    };
    readDisplayedEntries();
    const subscription = AppState.addEventListener("change", readDisplayedEntries);
    return () => subscription.remove();
  }, [bookId, isCalendarVisible, errorMessage, isLoadingSelectedDateEntries, markEntriesRead, selectedDate, selectedEntries]);

  return markEntriesRead;
}
