import { fetchOwnProfileDisplayName } from "../profiles";
import { fetchLedgerWidgetSummary } from "../widgetSummary";
import { sendEntrySaveNotifications } from "./entrySaveNotifications";
import { createOtherMemberCreatedEntryEvent } from "../../notifications/domain/notificationEventFactories";
import { logAppError } from "../logAppError";
import type { LedgerEntry } from "../../types/ledger";
import { getMonthKey, toIsoDate } from "../../utils/calendar";
import type { LedgerBook } from "../../types/ledgerBook";
import type { LedgerWidgetSummary } from "../../types/widget";
import type { NotificationEvent } from "../../notifications/domain/notificationEvents";

type Options = {
  activeBook: LedgerBook | null;
  userId: string;
  fallbackDisplayName: string;
  notifications: {
    notifySavedEntry: (entry: LedgerEntry, entries: LedgerEntry[]) => Promise<void>;
    sendPushNotificationToBookMembers: (
      bookId: string,
      event: NotificationEvent,
      excludeUserIds: string[],
      widget?: { monthKey: string; summary: LedgerWidgetSummary },
    ) => Promise<void>;
  };
};

export function createEntrySaveSideEffects({
  activeBook,
  userId,
  fallbackDisplayName,
  notifications,
}: Options) {
  async function notifySharedLedgerEntryChange(
    savedEntry: LedgerEntry,
    widget?: Awaited<ReturnType<typeof resolveCurrentLedgerWidgetPushSummary>>,
  ) {
    if (!activeBook) {
      return;
    }

    const actorName = await resolveCurrentActorName();
    const event = createOtherMemberCreatedEntryEvent(
      { actorName, bookName: activeBook.name },
      { ...savedEntry, authorId: userId, authorName: actorName },
    );

    await notifications.sendPushNotificationToBookMembers(activeBook.id, event, [userId], widget);
  }

  async function resolveCurrentLedgerWidgetPushSummary(bookId: string) {
    const today = new Date();
    const todayIsoDate = toIsoDate(today);

    return {
      monthKey: getMonthKey(today),
      summary: await fetchLedgerWidgetSummary(bookId, todayIsoDate),
    };
  }

  async function resolveCurrentActorName() {
    try {
      const displayName = (await fetchOwnProfileDisplayName(userId)).trim();
      return displayName || fallbackDisplayName;
    } catch {
      return fallbackDisplayName;
    }
  }

  async function runEntrySaveSideEffects(
    savedEntries: LedgerEntry[],
    currentEntries: LedgerEntry[],
    changeType: "create" | "update",
    targetDate: string,
  ) {
    const currentMonthEntries = savedEntries.filter((entry) => entry.date === targetDate);
    const lastEntry = currentMonthEntries[currentMonthEntries.length - 1];
    await sendEntrySaveNotifications({
      entries: changeType === "create" ? currentMonthEntries : [],
      notifyThreshold: async () => {
        if (lastEntry) {
          await notifications.notifySavedEntry(lastEntry, currentEntries);
        }
      },
      loadWidget: async () =>
        activeBook ? resolveCurrentLedgerWidgetPushSummary(activeBook.id) : undefined,
      notifyMember: notifySharedLedgerEntryChange,
      onError: (error, step) =>
        logAppError("App", error, {
          changeType,
          entryCount: savedEntries.length,
          step,
        }),
    });
  }

  return runEntrySaveSideEffects;
}
