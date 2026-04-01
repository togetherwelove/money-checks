import type { Session } from "@supabase/supabase-js";
import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";

import type { LedgerEntry, LedgerEntryDraft } from "../types/ledger";
import {
  buildMonthlyLedger,
  getMonthKey,
  parseIsoDate,
  startOfMonth,
  toIsoDate,
} from "../utils/calendar";
import { createDraft, sanitizeAmountInput } from "../utils/ledgerEntries";
import { removeLedgerEntry, saveLedgerEntry } from "./ledgerScreenState/helpers";
import type { BusyTaskTracker, LedgerScreenState } from "./ledgerScreenState/types";
import { useActiveLedgerBook } from "./ledgerScreenState/useActiveLedgerBook";
import { useLedgerEntries } from "./ledgerScreenState/useLedgerEntries";
import { useLedgerJoinRequests } from "./ledgerScreenState/useLedgerJoinRequests";

export type { LedgerScreenState } from "./ledgerScreenState/types";

export function useLedgerScreenState(session: Session): LedgerScreenState {
  const actualToday = startOfMonth(new Date());
  const [visibleMonth, setVisibleMonth] = useState(actualToday);
  const [selectedDate, setSelectedDate] = useState(() => toIsoDate(new Date()));
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [draft, setDraft] = useState<LedgerEntryDraft>(() => createDraft(toIsoDate(new Date())));
  const [busyTaskCount, setBusyTaskCount] = useState(0);
  const trackBusyTask: BusyTaskTracker = (task) => runBusyTask(setBusyTaskCount, task);
  const {
    activeBook,
    activeBookError,
    isLoadingBook,
    joinSharedLedgerBookByCode,
    leaveSharedLedgerBook,
    removeSharedLedgerMember,
    refreshSharedLedgerBook,
  } = useActiveLedgerBook(session.user.id, trackBusyTask);
  const { approveLedgerJoinRequest, pendingJoinRequests, rejectLedgerJoinRequest } =
    useLedgerJoinRequests(activeBook, session.user.id, trackBusyTask);
  const { entries, entriesError, isLoadingEntries, isRefreshing, refreshLedger, setEntries } =
    useLedgerEntries(activeBook?.id ?? null, visibleMonth);

  const monthlyLedger = useMemo(
    () => buildMonthlyLedger(getMonthKey(visibleMonth), entries),
    [entries, visibleMonth],
  );
  const selectedEntries = useMemo(
    () => entries.filter((entry) => entry.date === selectedDate),
    [entries, selectedDate],
  );

  const resetEditor = (isoDate: string) => {
    setSelectedDate(isoDate);
    setEditingEntryId(null);
    setDraft(createDraft(isoDate));
  };

  const handleSelectDate = (isoDate: string) => {
    const nextMonth = startOfMonth(parseIsoDate(isoDate));
    setVisibleMonth((currentMonth) =>
      getMonthKey(currentMonth) === getMonthKey(nextMonth) ? currentMonth : nextMonth,
    );
    resetEditor(isoDate);
  };

  const handleSaveEntry = async () => {
    if (!activeBook) {
      return null;
    }

    const amount = Number(draft.amount);
    if (!amount || !draft.category.trim()) {
      return null;
    }

    const nextEntry: LedgerEntry = {
      id: editingEntryId ?? "",
      date: selectedDate,
      type: draft.type,
      amount,
      category: draft.category.trim(),
      note: draft.note.trim(),
      sourceType: "manual",
    };

    const savedEntry = await saveLedgerEntry({
      activeBookId: activeBook.id,
      editingEntryId,
      entry: nextEntry,
      trackBusyTask,
      userId: session.user.id,
    });
    setEntries((currentEntries) =>
      editingEntryId
        ? currentEntries.map((entry) => (entry.id === savedEntry.id ? savedEntry : entry))
        : [...currentEntries, savedEntry],
    );

    resetEditor(selectedDate);
    return savedEntry;
  };

  const handleDeleteEntry = async (entryId: string) => {
    await removeLedgerEntry(entryId, trackBusyTask);
    setEntries((currentEntries) => currentEntries.filter((entry) => entry.id !== entryId));
    if (editingEntryId === entryId) {
      resetEditor(selectedDate);
    }
  };

  const handleEditEntry = (entry: LedgerEntry) => {
    setEditingEntryId(entry.id);
    setSelectedDate(entry.date);
    setDraft({
      date: entry.date,
      type: entry.type,
      amount: String(entry.amount),
      category: entry.category,
      note: entry.note,
    });
  };

  const errorMessage = activeBookError ?? entriesError;

  return {
    activeBook,
    draft,
    editingEntryId,
    errorMessage,
    entries,
    isBusy: busyTaskCount > 0,
    isLoading: isLoadingBook || isLoadingEntries,
    isRefreshing,
    joinSharedLedgerBookByCode,
    leaveSharedLedgerBook,
    monthlyLedger,
    pendingJoinRequests,
    approveLedgerJoinRequest,
    rejectLedgerJoinRequest,
    removeSharedLedgerMember,
    refreshLedger,
    refreshSharedLedgerBook,
    selectedDate,
    selectedEntries,
    setVisibleMonth,
    visibleMonth,
    handleDeleteEntry,
    handleEditEntry,
    handleSaveEntry,
    handleSelectDate,
    resetEditor,
    updateDraftField: (field, value) =>
      setDraft((currentDraft) => ({
        ...currentDraft,
        [field]: field === "amount" ? sanitizeAmountInput(value) : value,
      })),
    updateDraftType: (type) =>
      setDraft((currentDraft) => ({ ...currentDraft, category: "", type })),
  };
}

async function runBusyTask<T>(
  setBusyTaskCount: Dispatch<SetStateAction<number>>,
  task: () => Promise<T>,
): Promise<T> {
  setBusyTaskCount((currentCount) => currentCount + 1);
  try {
    return await task();
  } finally {
    setBusyTaskCount((currentCount) => Math.max(0, currentCount - 1));
  }
}
