import type { LedgerEntry } from "../types/ledger";

const LEDGER_ENTRY_SIGNATURE_ENTRY_SEPARATOR = "|";
const LEDGER_ENTRY_SIGNATURE_FIELD_SEPARATOR = ":";

export function buildLedgerEntryListSignature(entries: readonly LedgerEntry[]): string {
  return entries
    .map((entry) =>
      [entry.id, entry.amount, entry.content, entry.categoryId, entry.note, entry.type].join(
        LEDGER_ENTRY_SIGNATURE_FIELD_SEPARATOR,
      ),
    )
    .sort()
    .join(LEDGER_ENTRY_SIGNATURE_ENTRY_SEPARATOR);
}
