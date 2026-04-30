import type { LedgerEntry } from "../../types/ledger";
import { addMonths, getMonthKey, parseIsoDate } from "../../utils/calendar";
import { removeRealtimeLedgerEntry, upsertRealtimeLedgerEntry } from "./realtimeEntryUpdates";

export type LedgerEntryCache = Record<string, LedgerEntry[]>;
const CALENDAR_PRELOAD_MONTH_OFFSETS = [-1, 0, 1] as const;
const CALENDAR_VISIBLE_WINDOW_OFFSETS = [-1, 0, 1] as const;

export function getVisibleWindowMonthKeys(visibleMonth: Date): string[] {
  return CALENDAR_VISIBLE_WINDOW_OFFSETS.map((monthOffset) =>
    getMonthKey(addMonths(visibleMonth, monthOffset)),
  );
}

export function getCalendarPreloadMonths(visibleMonth: Date): Date[] {
  return CALENDAR_PRELOAD_MONTH_OFFSETS.map((monthOffset) => addMonths(visibleMonth, monthOffset));
}

export function getMonthKeysSignature(months: Date[]): string {
  return months.map((month) => getMonthKey(month)).join("|");
}

export function getMonthEntries(entryCache: LedgerEntryCache, month: Date): LedgerEntry[] {
  return entryCache[getMonthKey(month)] ?? [];
}

export function getVisibleWindowEntries(
  entryCache: LedgerEntryCache,
  visibleMonth: Date,
): LedgerEntry[] {
  return getVisibleWindowMonthKeys(visibleMonth)
    .flatMap((monthKey) => entryCache[monthKey] ?? [])
    .sort(compareLedgerEntries);
}

export function hasCachedMonth(entryCache: LedgerEntryCache, month: Date): boolean {
  return getMonthKey(month) in entryCache;
}

export function mergeEntriesIntoCache(
  entryCache: LedgerEntryCache,
  nextEntries: LedgerEntry[],
): LedgerEntryCache {
  const nextCache = { ...entryCache };

  for (const entry of nextEntries) {
    const monthKey = getMonthKey(parseIsoDate(entry.date));
    nextCache[monthKey] = upsertRealtimeLedgerEntry(nextCache[monthKey] ?? [], entry);
  }

  return nextCache;
}

export function setMonthEntriesInCache(
  entryCache: LedgerEntryCache,
  month: Date,
  nextEntries: LedgerEntry[],
): LedgerEntryCache {
  return {
    ...entryCache,
    [getMonthKey(month)]: [...nextEntries].sort(compareLedgerEntries),
  };
}

export function replaceVisibleWindowEntries(
  entryCache: LedgerEntryCache,
  visibleMonth: Date,
  nextEntries: LedgerEntry[],
): LedgerEntryCache {
  const nextCache = { ...entryCache };

  for (const monthKey of getVisibleWindowMonthKeys(visibleMonth)) {
    delete nextCache[monthKey];
  }

  return mergeEntriesIntoCache(nextCache, nextEntries);
}

export function upsertEntryInCache(
  entryCache: LedgerEntryCache,
  nextEntry: LedgerEntry,
): LedgerEntryCache {
  const monthKey = getMonthKey(parseIsoDate(nextEntry.date));
  return {
    ...entryCache,
    [monthKey]: upsertRealtimeLedgerEntry(entryCache[monthKey] ?? [], nextEntry),
  };
}

export function removeEntryFromCache(
  entryCache: LedgerEntryCache,
  entryId: string,
): LedgerEntryCache {
  return Object.fromEntries(
    Object.entries(entryCache).map(([monthKey, entries]) => [
      monthKey,
      removeRealtimeLedgerEntry(entries, entryId),
    ]),
  );
}

function compareLedgerEntries(left: LedgerEntry, right: LedgerEntry): number {
  if (left.date !== right.date) {
    return left.date.localeCompare(right.date);
  }

  return left.id.localeCompare(right.id);
}
