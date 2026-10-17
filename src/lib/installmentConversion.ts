import type { LedgerEntry } from "../types/ledger";
import { supabase } from "./supabase";

const CONVERT_FUNCTION = "convert_installment_to_one_time";

export function previewInstallmentConversion(entries: readonly LedgerEntry[], paidIds: readonly string[]) {
  const paid = new Set(paidIds);
  const remaining = entries.filter((entry) => !paid.has(entry.id));
  return {
    remaining,
    totalAmount: remaining.reduce((sum, entry) => sum + entry.amount, 0),
    paidCount: entries.length - remaining.length,
  };
}

export async function convertInstallmentToOneTime(
  bookId: string,
  groupId: string,
  entries: readonly LedgerEntry[],
  paidIds: readonly string[],
  date: string,
): Promise<void> {
  const { error } = await supabase.rpc(CONVERT_FUNCTION, {
    target_book_id: bookId,
    target_group_id: groupId,
    paid_entry_ids: paidIds,
    conversion_date: date,
    expected_entries: entries.map((entry) => ({ id: entry.id, updated_at: entry.updatedAt })),
  });
  if (error) throw error;
}
