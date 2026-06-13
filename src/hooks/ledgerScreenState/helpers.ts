import {
  deleteLedgerEntries,
  deleteLedgerEntry,
  fetchLedgerEntries,
  fetchLedgerEntriesByInstallmentGroup,
  fetchLedgerEntriesSummary,
  insertLedgerEntries,
  insertLedgerEntry,
  updateLedgerEntry,
} from "../../lib/ledgerEntries";
import type { LedgerEntry } from "../../types/ledger";
import { addMonths, getMonthKey, parseIsoDate } from "../../utils/calendar";
import { getLedgerMonthEnd, getLedgerMonthStart } from "../../utils/ledgerMonthWindow";
import type { BusyTaskTracker } from "./types";

export async function loadLedgerMonthsEntries(
  bookId: string,
  months: Date[],
): Promise<Record<string, LedgerEntry[]>> {
  if (months.length === 0) {
    return {};
  }

  const sortedMonths = [...months].sort((left, right) => left.getTime() - right.getTime());
  const requestedMonthKeys = new Set(months.map(getMonthKey));
  const entriesByMonthKey = Object.fromEntries(
    months.map((month) => [getMonthKey(month), [] as LedgerEntry[]]),
  );
  const entryGroups = await Promise.all(
    splitContiguousMonths(sortedMonths).map((monthGroup) => {
      const firstMonth = monthGroup[0];
      const lastMonth = monthGroup[monthGroup.length - 1];
      if (!firstMonth || !lastMonth) {
        return Promise.resolve([]);
      }

      return fetchLedgerEntriesSummary(
        bookId,
        getLedgerMonthStart(firstMonth),
        getLedgerMonthEnd(lastMonth),
      );
    }),
  );

  for (const entry of entryGroups.flat()) {
    const monthKey = getMonthKey(parseIsoDate(entry.date));
    if (!requestedMonthKeys.has(monthKey)) {
      continue;
    }

    entriesByMonthKey[monthKey]?.push(entry);
  }

  return entriesByMonthKey;
}

function splitContiguousMonths(months: Date[]): Date[][] {
  return months.reduce<Date[][]>((groups, month) => {
    const currentGroup = groups[groups.length - 1];
    const previousMonth = currentGroup?.[currentGroup.length - 1];

    if (
      !currentGroup ||
      !previousMonth ||
      getMonthKey(addMonths(previousMonth, 1)) !== getMonthKey(month)
    ) {
      groups.push([month]);
      return groups;
    }

    currentGroup.push(month);
    return groups;
  }, []);
}

export async function saveLedgerEntry(params: {
  activeBookId: string;
  editingEntryId: string | null;
  entry: LedgerEntry;
  trackBusyTask: BusyTaskTracker;
  userId: string;
}): Promise<LedgerEntry> {
  const { activeBookId, editingEntryId, entry, trackBusyTask, userId } = params;
  if (editingEntryId) {
    return trackBusyTask(() => updateLedgerEntry(entry));
  }

  return trackBusyTask(() => insertLedgerEntry(activeBookId, userId, entry));
}

export async function saveLedgerEntries(params: {
  activeBookId: string;
  entries: LedgerEntry[];
  trackBusyTask: BusyTaskTracker;
  userId: string;
}): Promise<LedgerEntry[]> {
  const { activeBookId, entries, trackBusyTask, userId } = params;
  return trackBusyTask(() => insertLedgerEntries(activeBookId, userId, entries));
}

export async function removeLedgerEntry(entryId: string): Promise<void> {
  await deleteLedgerEntry(entryId);
}

export async function removeLedgerEntries(
  entryIds: string[],
  trackBusyTask: BusyTaskTracker,
): Promise<void> {
  await trackBusyTask(() => deleteLedgerEntries(entryIds));
}

export async function loadInstallmentEntries(
  activeBookId: string,
  installmentGroupId: string,
  trackBusyTask: BusyTaskTracker,
): Promise<LedgerEntry[]> {
  return trackBusyTask(() =>
    fetchLedgerEntriesByInstallmentGroup(activeBookId, installmentGroupId),
  );
}
