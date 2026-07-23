import * as Notifications from "expo-notifications";

import {
  NotificationBadgeKinds,
  NotificationBadgeScopes,
  NotificationBadgeStorage,
} from "../../constants/notificationBadges";
import type { NotificationBadgeStateRow } from "../../types/supabase";
import { appStorage } from "../appStorage";
import type { FooterTabScreen } from "../footerTabs";
import { supabase } from "../supabase";

export type NotificationBadgeScope =
  (typeof NotificationBadgeScopes)[keyof typeof NotificationBadgeScopes];

export type NotificationBadgeBookState = {
  joinRequestUnreadCount: number;
  ledgerEntryUnreadCount: number;
};

export type NotificationBadgeSnapshot = {
  byBookId: Record<string, NotificationBadgeBookState>;
  totalUnreadCount: number;
};

const GET_NOTIFICATION_BADGE_STATE_FUNCTION = "get_notification_badge_state";
const MARK_NOTIFICATION_BADGES_READ_FUNCTION = "mark_notification_badges_read";

export function createEmptyNotificationBadgeSnapshot(): NotificationBadgeSnapshot {
  return {
    byBookId: {},
    totalUnreadCount: 0,
  };
}

export async function fetchNotificationBadgeSnapshot(): Promise<NotificationBadgeSnapshot> {
  const { data, error } = await supabase.rpc(GET_NOTIFICATION_BADGE_STATE_FUNCTION);
  if (error) {
    throw error;
  }

  return mapNotificationBadgeStateRows(data);
}

export async function markNotificationBadgeScopeRead(
  bookId: string,
  scope: NotificationBadgeScope,
): Promise<void> {
  const { error } = await supabase.rpc(MARK_NOTIFICATION_BADGES_READ_FUNCTION, {
    target_book_id: bookId,
    target_scope: scope,
  });
  if (error) {
    throw error;
  }
}

export function readCachedNotificationBadgeSnapshot(
  userId: string,
): NotificationBadgeSnapshot | null {
  const rawValue = appStorage.getItem(createNotificationBadgeCacheKey(userId));
  if (!rawValue) {
    return null;
  }

  try {
    return parseNotificationBadgeSnapshot(JSON.parse(rawValue));
  } catch {
    return null;
  }
}

export function writeCachedNotificationBadgeSnapshot(
  userId: string,
  snapshot: NotificationBadgeSnapshot,
): void {
  appStorage.setItem(createNotificationBadgeCacheKey(userId), JSON.stringify(snapshot));
}

export function resolveFooterBadgeScreens(
  snapshot: NotificationBadgeSnapshot,
): FooterTabScreen[] {
  const screens: FooterTabScreen[] = [];
  const bookStates = Object.values(snapshot.byBookId);

  if (bookStates.some((state) => state.ledgerEntryUnreadCount > 0)) {
    screens.push("all-entries");
  }
  if (bookStates.some((state) => state.joinRequestUnreadCount > 0)) {
    screens.push("share");
  }

  return screens;
}

export function resolveBadgedBookIds(snapshot: NotificationBadgeSnapshot): string[] {
  return Object.entries(snapshot.byBookId)
    .filter(
      ([, state]) => state.ledgerEntryUnreadCount > 0 || state.joinRequestUnreadCount > 0,
    )
    .map(([bookId]) => bookId);
}

export function resolveBookNotificationBadgeCount(
  snapshot: NotificationBadgeSnapshot,
  bookId: string | null | undefined,
  scope: NotificationBadgeScope,
): number {
  if (!bookId) {
    return 0;
  }

  const bookState = snapshot.byBookId[bookId];
  if (!bookState) {
    return 0;
  }

  return scope === NotificationBadgeScopes.ledgerEntries
    ? bookState.ledgerEntryUnreadCount
    : bookState.joinRequestUnreadCount;
}

export function canMarkNotificationBadgeScopeRead(
  scope: NotificationBadgeScope,
  isBookOwner: boolean,
): boolean {
  return scope !== NotificationBadgeScopes.joinRequests || isBookOwner;
}

export function resolveSnapshotAfterReadingScope(
  snapshot: NotificationBadgeSnapshot,
  bookId: string,
  scope: NotificationBadgeScope,
): NotificationBadgeSnapshot {
  const currentBookState = snapshot.byBookId[bookId];
  if (!currentBookState) {
    return snapshot;
  }

  const readCount =
    scope === NotificationBadgeScopes.ledgerEntries
      ? currentBookState.ledgerEntryUnreadCount
      : currentBookState.joinRequestUnreadCount;
  if (readCount === 0) {
    return snapshot;
  }

  return {
    byBookId: {
      ...snapshot.byBookId,
      [bookId]: {
        ...currentBookState,
        ...(scope === NotificationBadgeScopes.ledgerEntries
          ? { ledgerEntryUnreadCount: 0 }
          : { joinRequestUnreadCount: 0 }),
      },
    },
    totalUnreadCount: Math.max(snapshot.totalUnreadCount - readCount, 0),
  };
}

export async function dismissPresentedNotificationBadges(
  bookId: string,
  scope: NotificationBadgeScope,
): Promise<void> {
  const badgeKind =
    scope === NotificationBadgeScopes.ledgerEntries
      ? NotificationBadgeKinds.ledgerEntry
      : NotificationBadgeKinds.joinRequest;
  const presentedNotifications = await Notifications.getPresentedNotificationsAsync();
  const matchingNotificationIds = presentedNotifications
    .filter((notification) => {
      const data = notification.request.content.data;
      return data?.badgeKind === badgeKind && data.badgeBookId === bookId;
    })
    .map((notification) => notification.request.identifier);

  await Promise.all(
    matchingNotificationIds.map((notificationId) =>
      Notifications.dismissNotificationAsync(notificationId),
    ),
  );
}

function createNotificationBadgeCacheKey(userId: string): string {
  return `${NotificationBadgeStorage.cacheKeyPrefix}.${userId}`;
}

function mapNotificationBadgeStateRows(value: unknown): NotificationBadgeSnapshot {
  if (!Array.isArray(value)) {
    return createEmptyNotificationBadgeSnapshot();
  }

  const byBookId: NotificationBadgeSnapshot["byBookId"] = {};
  let totalUnreadCount = 0;

  for (const rawRow of value) {
    if (!isNotificationBadgeStateRow(rawRow)) {
      continue;
    }

    const ledgerEntryUnreadCount = readUnreadCount(rawRow.ledger_entry_unread_count);
    const joinRequestUnreadCount = readUnreadCount(rawRow.join_request_unread_count);
    byBookId[rawRow.book_id] = {
      joinRequestUnreadCount,
      ledgerEntryUnreadCount,
    };
    totalUnreadCount += ledgerEntryUnreadCount + joinRequestUnreadCount;
  }

  return {
    byBookId,
    totalUnreadCount,
  };
}

function parseNotificationBadgeSnapshot(value: unknown): NotificationBadgeSnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<NotificationBadgeSnapshot>;
  if (!candidate.byBookId || typeof candidate.byBookId !== "object") {
    return null;
  }

  const byBookId: NotificationBadgeSnapshot["byBookId"] = {};
  let totalUnreadCount = 0;

  for (const [bookId, rawState] of Object.entries(candidate.byBookId)) {
    if (!rawState || typeof rawState !== "object") {
      continue;
    }

    const state = rawState as Partial<NotificationBadgeBookState>;
    const ledgerEntryUnreadCount = readUnreadCount(state.ledgerEntryUnreadCount);
    const joinRequestUnreadCount = readUnreadCount(state.joinRequestUnreadCount);
    byBookId[bookId] = {
      joinRequestUnreadCount,
      ledgerEntryUnreadCount,
    };
    totalUnreadCount += ledgerEntryUnreadCount + joinRequestUnreadCount;
  }

  return {
    byBookId,
    totalUnreadCount,
  };
}

function isNotificationBadgeStateRow(value: unknown): value is NotificationBadgeStateRow {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<NotificationBadgeStateRow>;
  return (
    typeof candidate.book_id === "string" &&
    (typeof candidate.ledger_entry_unread_count === "number" ||
      typeof candidate.ledger_entry_unread_count === "string") &&
    (typeof candidate.join_request_unread_count === "number" ||
      typeof candidate.join_request_unread_count === "string")
  );
}

function readUnreadCount(value: unknown): number {
  const numericValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? Math.floor(numericValue) : 0;
}
