import {
  deleteLedgerEntry,
  fetchLedgerEntries,
  insertLedgerEntry,
  updateLedgerEntry,
} from "../../lib/ledgerEntries";
import type { LedgerEntry } from "../../types/ledger";
import { getLedgerWindowEnd, getLedgerWindowStart } from "../../utils/ledgerMonthWindow";
import type { BusyTaskTracker } from "./types";

export async function loadBookEntries(bookId: string, visibleMonth: Date): Promise<LedgerEntry[]> {
  return fetchLedgerEntries(
    bookId,
    getLedgerWindowStart(visibleMonth),
    getLedgerWindowEnd(visibleMonth),
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

export async function removeLedgerEntry(
  entryId: string,
  trackBusyTask: BusyTaskTracker,
): Promise<void> {
  await trackBusyTask(() => deleteLedgerEntry(entryId));
}
