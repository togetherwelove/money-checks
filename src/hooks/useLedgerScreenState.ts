import type { Session } from "@supabase/supabase-js";
import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";

import type { MonthPage } from "../components/monthCalendarPager/monthCalendarPagerUtils";
import type { LedgerEntry, LedgerEntryDraft } from "../types/ledger";
import { addMonths, getMonthKey, parseIsoDate, startOfMonth, toIsoDate } from "../utils/calendar";
import { canSubmitDraft, createDraft, sanitizeAmountInput } from "../utils/ledgerEntries";
import {
  getChartMonthDataFromCache,
  getMonthPageFromCache,
  getMonthlyInsightsFromCache,
  getMonthlyLedgerFromCache,
} from "./ledgerScreenState/calendarMonthData";
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
  const {
    entries,
    entriesError,
    entryCache,
    isLoadingEntries,
    isRefreshing,
    refreshLedger,
    setEntries,
  } = useLedgerEntries(activeBook?.id ?? null, visibleMonth);

  const monthlyLedger = useMemo(
    () => getMonthlyLedgerFromCache(entryCache, visibleMonth),
    [entryCache, visibleMonth],
  );
  const monthlyInsights = useMemo(
    () => getMonthlyInsightsFromCache(entryCache, visibleMonth),
    [entryCache, visibleMonth],
  );
  const selectedEntries = useMemo(
    () => entries.filter((entry) => entry.date === selectedDate),
    [entries, selectedDate],
  );
  const previousMonthPage = useMemo<MonthPage>(
    () => getMonthPageFromCache(entryCache, addMonths(visibleMonth, -1)),
    [entryCache, visibleMonth],
  );
  const currentMonthPage = useMemo<MonthPage>(
    () => getMonthPageFromCache(entryCache, visibleMonth),
    [entryCache, visibleMonth],
  );
  const nextMonthPage = useMemo<MonthPage>(
    () => getMonthPageFromCache(entryCache, addMonths(visibleMonth, 1)),
    [entryCache, visibleMonth],
  );
  const previousChartMonth = useMemo(
    () => getChartMonthDataFromCache(entryCache, addMonths(visibleMonth, -1)),
    [entryCache, visibleMonth],
  );
  const currentChartMonth = useMemo(
    () => getChartMonthDataFromCache(entryCache, visibleMonth),
    [entryCache, visibleMonth],
  );
  const nextChartMonth = useMemo(
    () => getChartMonthDataFromCache(entryCache, addMonths(visibleMonth, 1)),
    [entryCache, visibleMonth],
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
    const savedEntry = await persistDraftEntry(draft, editingEntryId);
    if (!savedEntry) {
      return null;
    }

    resetEditor(draft.date);
    return savedEntry;
  };

  const handleSaveEntryDrafts = async (drafts: LedgerEntryDraft[]) => {
    const savedEntries: LedgerEntry[] = [];

    for (const queuedDraft of drafts) {
      const savedEntry = await persistDraftEntry(queuedDraft, null);
      if (savedEntry) {
        savedEntries.push(savedEntry);
      }
    }

    if (savedEntries.length > 0) {
      resetEditor(selectedDate);
    }

    return savedEntries;
  };

  const persistDraftEntry = async (
    draftToSave: LedgerEntryDraft,
    targetEditingEntryId: string | null,
  ) => {
    if (!activeBook) {
      return null;
    }

    if (!canSubmitDraft(draftToSave)) {
      return null;
    }

    const amount = Number(draftToSave.amount);
    const nextEntry: LedgerEntry = {
      id: targetEditingEntryId ?? "",
      date: draftToSave.date,
      type: draftToSave.type,
      amount,
      content: draftToSave.content.trim(),
      category: draftToSave.category.trim(),
      note: draftToSave.note.trim(),
      sourceType: "manual",
    };

    const savedEntry = await saveLedgerEntry({
      activeBookId: activeBook.id,
      editingEntryId: targetEditingEntryId,
      entry: nextEntry,
      trackBusyTask,
      userId: session.user.id,
    });
    setEntries((currentEntries) =>
      targetEditingEntryId
        ? currentEntries.map((entry) => (entry.id === savedEntry.id ? savedEntry : entry))
        : [...currentEntries, savedEntry],
    );

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
      content: entry.content,
      category: entry.category,
      note: entry.note,
    });
  };

  const errorMessage = activeBookError ?? entriesError;

  return {
    activeBook,
    currentChartMonth,
    draft,
    editingEntryId,
    errorMessage,
    entries,
    isBusy: busyTaskCount > 0,
    isLoading: isLoadingBook || isLoadingEntries,
    isRefreshing,
    joinSharedLedgerBookByCode,
    leaveSharedLedgerBook,
    currentMonthPage,
    monthlyLedger,
    monthlyInsights,
    nextMonthPage,
    nextChartMonth,
    pendingJoinRequests,
    previousMonthPage,
    previousChartMonth,
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
    handleSaveEntryDrafts,
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
