import type { LedgerEntry } from "../types/ledger";
import type { LedgerEntryRow } from "../types/supabase";

export function mapLedgerEntryRow(row: LedgerEntryRow, authorName?: string): LedgerEntry {
  return {
    authorId: row.user_id,
    authorName,
    id: row.id,
    date: row.occurred_on,
    type: row.entry_type,
    amount: Number(row.amount),
    content: row.content,
    category: row.category,
    installmentGroupId: row.installment_group_id,
    installmentMonths: row.installment_months,
    installmentOrder: row.installment_order,
    note: row.note,
    sourceType: row.source_type,
  };
}
