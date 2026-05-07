export const LedgerQueryConfig = {
  allEntriesPageSize: 30,
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
