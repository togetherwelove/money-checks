import type { LedgerEntry } from "../../types/ledger";
import { appStorage } from "../appStorage";
import type { FooterTabScreen } from "../footerTabs";

export type UnreadNotificationBadgeEvent = {
  bookId?: string;
  entryDate?: string;
  entryId: string;
  id: string;
  notificationId?: string;
  receivedAt: string;
  screen: FooterTabScreen;
  type: "ledger-entry";
};

const UNREAD_NOTIFICATION_BADGES_STORAGE_KEY_PREFIX = "money-checks.notification-badges.unread";
const MAX_UNREAD_NOTIFICATION_BADGE_EVENTS = 100;

export function readUnreadNotificationBadgeEvents(userId: string): UnreadNotificationBadgeEvent[] {
  const rawValue = appStorage.getItem(createUnreadNotificationBadgesStorageKey(userId));
  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(isUnreadNotificationBadgeEvent);
  } catch {
    return [];
  }
}

export function writeUnreadNotificationBadgeEvents(
  userId: string,
  events: readonly UnreadNotificationBadgeEvent[],
) {
  appStorage.setItem(
    createUnreadNotificationBadgesStorageKey(userId),
    JSON.stringify(events.slice(-MAX_UNREAD_NOTIFICATION_BADGE_EVENTS)),
  );
}

export function resolveUnreadNotificationBadgeEventFromData(
  data: Record<string, unknown> | undefined,
  notificationId?: string,
): UnreadNotificationBadgeEvent | null {
  if (!data || data.badgeKind !== "ledger-entry") {
    return null;
  }

  const entryId = readString(data.badgeEntryId);
  if (!entryId) {
    return null;
  }

  const bookId = readString(data.badgeBookId);
  const entryDate = readString(data.badgeEntryDate);

  return {
    ...(bookId ? { bookId } : {}),
    ...(entryDate ? { entryDate } : {}),
    entryId,
    id: `ledger-entry:${entryId}`,
    ...(notificationId ? { notificationId } : {}),
    receivedAt: new Date().toISOString(),
    screen: "all-entries",
    type: "ledger-entry",
  };
}

export function appendUnreadNotificationBadgeEvent(
  events: readonly UnreadNotificationBadgeEvent[],
  event: UnreadNotificationBadgeEvent,
): UnreadNotificationBadgeEvent[] {
  return [...events.filter((currentEvent) => currentEvent.id !== event.id), event].slice(
    -MAX_UNREAD_NOTIFICATION_BADGE_EVENTS,
  );
}

export function removeConfirmedUnreadEntryBadgeEvents(
  events: UnreadNotificationBadgeEvent[],
  entries: readonly LedgerEntry[],
  activeBookId?: string | null,
): UnreadNotificationBadgeEvent[] {
  if (events.length === 0 || entries.length === 0) {
    return events;
  }

  const loadedEntryIds = new Set(entries.map((entry) => entry.id));
  const nextEvents = events.filter((event) => {
    if (event.type !== "ledger-entry") {
      return true;
    }

    if (activeBookId && event.bookId && event.bookId !== activeBookId) {
      return true;
    }

    return !loadedEntryIds.has(event.entryId);
  });
  return nextEvents.length === events.length ? events : nextEvents;
}

export function resolveFooterBadgeScreens(
  events: readonly UnreadNotificationBadgeEvent[],
  hasPendingJoinRequest: boolean,
): FooterTabScreen[] {
  const screens = new Set<FooterTabScreen>();

  for (const event of events) {
    screens.add(event.screen);
  }

  if (hasPendingJoinRequest) {
    screens.add("share");
  }

  return [...screens];
}

export function resolveAppIconBadgeCount(
  events: readonly UnreadNotificationBadgeEvent[],
  hasPendingJoinRequest: boolean,
): number {
  return events.length + (hasPendingJoinRequest ? 1 : 0);
}

function createUnreadNotificationBadgesStorageKey(userId: string) {
  return `${UNREAD_NOTIFICATION_BADGES_STORAGE_KEY_PREFIX}.${userId}`;
}

function isUnreadNotificationBadgeEvent(value: unknown): value is UnreadNotificationBadgeEvent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<UnreadNotificationBadgeEvent>;
  return (
    candidate.type === "ledger-entry" &&
    candidate.screen === "all-entries" &&
    typeof candidate.id === "string" &&
    typeof candidate.entryId === "string" &&
    typeof candidate.receivedAt === "string"
  );
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}
