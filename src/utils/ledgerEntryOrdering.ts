import type { LedgerEntry } from "../types/ledger";

export function compareLedgerEntriesByDisplayOrder(
  leftEntry: LedgerEntry,
  rightEntry: LedgerEntry,
): number {
  if (leftEntry.date !== rightEntry.date) {
    return leftEntry.date.localeCompare(rightEntry.date);
  }

  const createdAtComparison = (leftEntry.createdAt ?? "").localeCompare(rightEntry.createdAt ?? "");
  if (createdAtComparison !== 0) {
    return createdAtComparison;
  }

  return leftEntry.id.localeCompare(rightEntry.id);
}

export function compareLedgerEntriesByCreatedAtAsc(
  leftEntry: LedgerEntry,
  rightEntry: LedgerEntry,
): number {
  const createdAtComparison = (leftEntry.createdAt ?? "").localeCompare(rightEntry.createdAt ?? "");
  if (createdAtComparison !== 0) {
    return createdAtComparison;
  }

  return leftEntry.id.localeCompare(rightEntry.id);
}

export function compareLedgerEntriesByCreatedAtDesc(
  leftEntry: LedgerEntry,
  rightEntry: LedgerEntry,
): number {
  return compareLedgerEntriesByCreatedAtAsc(rightEntry, leftEntry);
}
