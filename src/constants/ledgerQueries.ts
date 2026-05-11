export const LedgerQueryConfig = {
  allEntriesPageSize: 30,
  realtimeRefreshDelayMs: 250,
} as const;

export const LedgerRealtimeConfig = {
  allEntriesChannelScope: "all-entries",
  calendarChannelScope: "calendar",
  ledgerEntriesAllEvents: "*",
  ledgerEntriesBookIdFilterColumn: "book_id",
  ledgerEntriesChannelPrefix: "ledger-entries",
  ledgerEntriesTable: "ledger_entries",
  postgresChangesEvent: "postgres_changes",
  publicSchema: "public",
} as const;

export const LedgerEntrySelectColumns = {
  attachmentCleanup: ["id", "installment_group_id"].join(","),
  list: [
    "book_id",
    "id",
    "user_id",
    "source_type",
    "entry_type",
    "occurred_on",
    "amount",
    "currency",
    "content",
    "category",
    "category_id",
    "installment_group_id",
    "installment_months",
    "installment_order",
    "note",
    "metadata",
    "created_at",
    "updated_at",
  ].join(","),
} as const;
