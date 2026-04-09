import type { LedgerEntry } from "../../types/ledger";
import type { LedgerEntryRow } from "../../types/supabase";

export function isLedgerEntryRowInWindow(
  row: LedgerEntryRow,
  windowStart: string,
  windowEnd: string,
): boolean {
  return row.occurred_on >= windowStart && row.occurred_on <= windowEnd;
}

export function removeRealtimeLedgerEntry(
  currentEntries: LedgerEntry[],
  entryId: string,
): LedgerEntry[] {
  return currentEntries.filter((entry) => entry.id !== entryId);
}

export function upsertRealtimeLedgerEntry(
  currentEntries: LedgerEntry[],
  nextEntry: LedgerEntry,
): LedgerEntry[] {
  const nextEntries = currentEntries.some((entry) => entry.id === nextEntry.id)
    ? currentEntries.map((entry) => (entry.id === nextEntry.id ? nextEntry : entry))
    : [...currentEntries, nextEntry];

  return sortLedgerEntries(nextEntries);
}

function sortLedgerEntries(entries: LedgerEntry[]): LedgerEntry[] {
  return [...entries].sort((left, right) => {
    if (left.date !== right.date) {
      return left.date.localeCompare(right.date);
    }

    return left.id.localeCompare(right.id);
  });
}
