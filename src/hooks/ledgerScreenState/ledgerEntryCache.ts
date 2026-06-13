import type { LedgerEntry } from "../../types/ledger";
import { addMonths, getMonthKey, parseIsoDate } from "../../utils/calendar";
import { compareLedgerEntriesByDisplayOrder } from "../../utils/ledgerEntryOrdering";
import { MONTHLY_TREND_MONTH_COUNT } from "../../utils/monthlyInsights";
import { removeRealtimeLedgerEntry, upsertRealtimeLedgerEntry } from "./realtimeEntryUpdates";

export type LedgerEntryCache = Record<string, LedgerEntry[]>;
const CALENDAR_PAGE_PRELOAD_MONTH_OFFSETS = [0] as const;
const CALENDAR_BACKGROUND_PRELOAD_MONTH_OFFSETS = [-1, 1] as const;
const CALENDAR_VISIBLE_WINDOW_OFFSETS = [-1, 0, 1] as const;
const CHART_TREND_PRELOAD_MONTH_OFFSETS = Array.from(
  { length: MONTHLY_TREND_MONTH_COUNT },
  (_, index) => index - MONTHLY_TREND_MONTH_COUNT + 1,
);

function getVisibleWindowMonthKeys(visibleMonth: Date): string[] {
  return getVisibleWindowMonths(visibleMonth).map((month) => getMonthKey(month));
}

export function getVisibleWindowMonths(visibleMonth: Date): Date[] {
  return CALENDAR_VISIBLE_WINDOW_OFFSETS.map((monthOffset) => addMonths(visibleMonth, monthOffset));
}

export function getCalendarPagePreloadMonths(visibleMonth: Date): Date[] {
  return CALENDAR_PAGE_PRELOAD_MONTH_OFFSETS.map((monthOffset) =>
    addMonths(visibleMonth, monthOffset),
  );
}

export function getCalendarBackgroundPreloadMonths(visibleMonth: Date): Date[] {
  return CALENDAR_BACKGROUND_PRELOAD_MONTH_OFFSETS.map((monthOffset) =>
    addMonths(visibleMonth, monthOffset),
  );
}

export function getChartTrendPreloadMonths(visibleMonth: Date): Date[] {
  return CHART_TREND_PRELOAD_MONTH_OFFSETS.map((monthOffset) =>
    addMonths(visibleMonth, monthOffset),
  );
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
    .sort(compareLedgerEntriesByDisplayOrder);
}

export function hasCachedMonth(entryCache: LedgerEntryCache, month: Date): boolean {
  return getMonthKey(month) in entryCache;
}

function mergeEntriesIntoCache(
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
    [getMonthKey(month)]: [...nextEntries].sort(compareLedgerEntriesByDisplayOrder),
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

export function upsertEntryInCachedMonth(
  entryCache: LedgerEntryCache,
  nextEntry: LedgerEntry,
): LedgerEntryCache {
  const monthKey = getMonthKey(parseIsoDate(nextEntry.date));
  if (!(monthKey in entryCache)) {
    return entryCache;
  }

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
