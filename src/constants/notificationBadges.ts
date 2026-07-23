export const NotificationBadgeScopes = {
  joinRequests: "join-requests",
  ledgerEntries: "ledger-entries",
} as const;

export const NotificationBadgeKinds = {
  joinRequest: "join-request",
  ledgerEntry: "ledger-entry",
} as const;

export const NotificationBadgeStorage = {
  cacheKeyPrefix: "money-checks.notification-badges.snapshot",
} as const;

export const NotificationBadgeDatabase = {
  joinRequestsTable: "ledger_book_join_requests",
  ledgerEntriesTable: "ledger_entries",
  readStatesTable: "notification_badge_read_states",
} as const;

export const NotificationBadgeCopy = {
  unreadBookAccessibilityLabel: "새 알림 있음",
} as const;

export const NotificationBadgeUi = {
  bookSwitcherDotSize: 8,
} as const;
