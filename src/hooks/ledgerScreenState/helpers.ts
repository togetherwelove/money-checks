import {
  deleteLedgerEntries,
  deleteLedgerEntry,
  fetchLedgerEntries,
  fetchLedgerEntriesSummary,
  fetchLedgerEntriesByInstallmentGroup,
  insertLedgerEntries,
  insertLedgerEntry,
  updateLedgerEntry,
} from "../../lib/ledgerEntries";
import type { LedgerEntry } from "../../types/ledger";
import { getLedgerMonthEnd, getLedgerMonthStart } from "../../utils/ledgerMonthWindow";
import type { BusyTaskTracker } from "./types";

export async function loadLedgerMonthEntries(
  bookId: string,
  visibleMonth: Date,
): Promise<LedgerEntry[]> {
  return fetchLedgerEntriesSummary(
    bookId,
    getLedgerMonthStart(visibleMonth),
    getLedgerMonthEnd(visibleMonth),
  );
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

export async function removeLedgerEntry(
  entryId: string,
  trackBusyTask: BusyTaskTracker,
): Promise<void> {
  await trackBusyTask(() => deleteLedgerEntry(entryId));
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
