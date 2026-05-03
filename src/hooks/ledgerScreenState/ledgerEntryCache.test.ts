import { describe, expect, it } from "vitest";

import type { LedgerEntry } from "../../types/ledger";
import {
  getCalendarPreloadMonths,
  getVisibleWindowEntries,
  hasCachedMonth,
  mergeEntriesIntoCache,
  removeEntryFromCache,
  replaceVisibleWindowEntries,
  upsertEntryInCache,
} from "./ledgerEntryCache";

const aprilEntry: LedgerEntry = {
  amount: 1000,
  category: "식비",
  content: "점심",
  date: "2026-04-09",
  id: "april-1",
  note: "",
  photoAttachments: [],
  type: "expense",
};

const mayEntry: LedgerEntry = {
  amount: 2000,
  category: "교통",
  content: "버스",
  date: "2026-05-11",
  id: "may-1",
  note: "",
  photoAttachments: [],
  type: "expense",
};

const juneEntry: LedgerEntry = {
  amount: 3000,
  category: "급여",
  content: "월급",
  date: "2026-06-01",
  id: "june-1",
  note: "",
  photoAttachments: [],
  type: "income",
};

describe("ledgerEntryCache", () => {
  it("preloads the full calendar pager data window before background months", () => {
    expect(getCalendarPreloadMonths(new Date(2026, 4, 1)).map(toMonthKey)).toEqual([
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
    ]);
  });

  it("merges fetched entries by month and returns the visible 3-month window", () => {
    const cache = mergeEntriesIntoCache({}, [aprilEntry, mayEntry, juneEntry]);

    expect(hasCachedMonth(cache, new Date(2026, 4, 1))).toBe(true);
    expect(getVisibleWindowEntries(cache, new Date(2026, 4, 1)).map((entry) => entry.id)).toEqual([
      "april-1",
      "may-1",
      "june-1",
    ]);
  });

  it("updates and removes cached entries by id", () => {
    const mergedCache = mergeEntriesIntoCache({}, [mayEntry]);
    const updatedCache = upsertEntryInCache(mergedCache, { ...mayEntry, amount: 2500 });
    const prunedCache = removeEntryFromCache(updatedCache, mayEntry.id);

    expect(updatedCache["2026-05"]?.[0]?.amount).toBe(2500);
    expect(prunedCache["2026-05"]).toEqual([]);
  });

  it("replaces only the visible 3-month window cache", () => {
    const mergedCache = mergeEntriesIntoCache({}, [aprilEntry, mayEntry, juneEntry]);
    const replacedCache = replaceVisibleWindowEntries(mergedCache, new Date(2026, 4, 1), [
      mayEntry,
    ]);

    expect(
      getVisibleWindowEntries(replacedCache, new Date(2026, 4, 1)).map((entry) => entry.id),
    ).toEqual(["may-1"]);
  });
});

function toMonthKey(month: Date): string {
  return `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
}
