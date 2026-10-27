import type { LedgerEntry } from "../../types/ledger";
import { getMonthKey } from "../../utils/calendar";
import { setMonthEntriesInCache, type LedgerEntryCache } from "./ledgerEntryCache";

export function updateBookEntryCache(
  cacheByBookId: Record<string, LedgerEntryCache>,
  bookId: string,
  updateCache: (currentCache: LedgerEntryCache) => LedgerEntryCache,
): Record<string, LedgerEntryCache> {
  return {
    ...cacheByBookId,
    [bookId]: updateCache(cacheByBookId[bookId] ?? {}),
  };
}

export function countLedgerEntriesByMonth(entriesByMonth: Record<string, LedgerEntry[]>): number {
  return Object.values(entriesByMonth).reduce((count, entries) => count + entries.length, 0);
}

export function setMonthsEntriesInCache(
  cache: LedgerEntryCache,
  months: Date[],
  entriesByMonth: Record<string, LedgerEntry[]>,
): LedgerEntryCache {
  return months.reduce(
    (nextCache, month) =>
      setMonthEntriesInCache(nextCache, month, entriesByMonth[getMonthKey(month)] ?? []),
    cache,
  );
}
