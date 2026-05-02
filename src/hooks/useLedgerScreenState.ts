import type { Session } from "@supabase/supabase-js";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { MonthPage } from "../components/monthCalendarPager/monthCalendarPagerUtils";
import { buildInstallmentSettlementEntry, buildLedgerEntriesFromDraft } from "../lib/installments";
import type { LedgerEntry, LedgerEntryDraft, LedgerEntryPhotoAttachment } from "../types/ledger";
import { addMonths, getMonthKey, parseIsoDate, startOfMonth, toIsoDate } from "../utils/calendar";
import {
  canSubmitDraft,
  createDraft,
  mergeEntries,
  sanitizeAmountInput,
} from "../utils/ledgerEntries";
import {
  getChartMonthDataFromCache,
  getMonthPageFromCache,
  getMonthlyInsightsFromCache,
  getMonthlyLedgerFromCache,
} from "./ledgerScreenState/calendarMonthData";
import {
  loadInstallmentEntries,
  removeLedgerEntries,
  removeLedgerEntry,
  saveLedgerEntries,
  saveLedgerEntry,
} from "./ledgerScreenState/helpers";
import type { BusyTaskTracker, LedgerScreenState } from "./ledgerScreenState/types";
import { useActiveLedgerBook } from "./ledgerScreenState/useActiveLedgerBook";
import { useLedgerDayNotes } from "./ledgerScreenState/useLedgerDayNotes";
import { useLedgerEntries } from "./ledgerScreenState/useLedgerEntries";
import { useLedgerJoinRequests } from "./ledgerScreenState/useLedgerJoinRequests";
import { useSelectedDateEntries } from "./ledgerScreenState/useSelectedDateEntries";

export type { LedgerScreenState } from "./ledgerScreenState/types";

export function useLedgerScreenState(session: Session): LedgerScreenState {
  const actualToday = startOfMonth(new Date());
  const [visibleMonth, setVisibleMonth] = useState(actualToday);
  const [selectedDate, setSelectedDate] = useState(() => toIsoDate(new Date()));
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const previousActiveBookId = useRef<string | null>(null);
  const [draft, setDraft] = useState<LedgerEntryDraft>(() =>
    createDraft(toIsoDate(new Date()), session.user.id),
  );
  const [busyTaskCount, setBusyTaskCount] = useState(0);
  const trackBusyTask: BusyTaskTracker = (task) => runBusyTask(setBusyTaskCount, task);
  const {
    activeBook,
    activeBookError,
    accessibleBooks,
    createLedgerBook,
    isLoadingBook,
    joinSharedLedgerBookByCode,
    leaveSharedLedgerBook,
    removeSharedLedgerMember,
    renameActiveLedgerBook,
    refreshSharedLedgerBook,
    switchLedgerBook,
  } = useActiveLedgerBook(session.user.id, trackBusyTask);
  const { approveLedgerJoinRequest, pendingJoinRequests, rejectLedgerJoinRequest } =
    useLedgerJoinRequests(activeBook, session.user.id, trackBusyTask);
  const { dateNoteByDate, refreshLedgerDayNotes, removeLedgerDayNote, saveLedgerDayNote } =
    useLedgerDayNotes(activeBook?.id ?? null, trackBusyTask, session.user.id, visibleMonth);
  const {
    entries,
    entriesError,
    entryCache,
    isLoadingEntries,
    isRefreshing,
    refreshLedger,
    setEntries,
  } = useLedgerEntries(activeBook?.id ?? null, visibleMonth);
  const selectedDateSummaryEntries = useMemo(
    () => entries.filter((entry) => entry.date === selectedDate),
    [entries, selectedDate],
  );
  const selectedDateEntrySignature = useMemo(
    () =>
      selectedDateSummaryEntries
        .map(
          (entry) =>
            `${entry.id}:${entry.amount}:${entry.content}:${entry.category}:${entry.note}:${entry.type}`,
        )
        .join("|"),
    [selectedDateSummaryEntries],
  );
  const {
    isLoadingSelectedDateEntries,
    refreshSelectedDateEntries,
    selectedEntries,
    selectedEntriesError,
  } = useSelectedDateEntries(activeBook?.id ?? null, selectedDate, selectedDateEntrySignature);

  const monthlyLedger = useMemo(
    () => getMonthlyLedgerFromCache(dateNoteByDate, entryCache, visibleMonth),
    [dateNoteByDate, entryCache, visibleMonth],
  );
  const monthlyInsights = useMemo(
    () => getMonthlyInsightsFromCache(entryCache, visibleMonth),
    [entryCache, visibleMonth],
  );
  const previousMonthPage = useMemo<MonthPage>(
    () => getMonthPageFromCache(dateNoteByDate, entryCache, addMonths(visibleMonth, -1)),
    [dateNoteByDate, entryCache, visibleMonth],
  );
  const currentMonthPage = useMemo<MonthPage>(
    () => getMonthPageFromCache(dateNoteByDate, entryCache, visibleMonth),
    [dateNoteByDate, entryCache, visibleMonth],
  );
  const nextMonthPage = useMemo<MonthPage>(
    () => getMonthPageFromCache(dateNoteByDate, entryCache, addMonths(visibleMonth, 1)),
    [dateNoteByDate, entryCache, visibleMonth],
  );
  const previousChartMonth = useMemo(
    () => getChartMonthDataFromCache(dateNoteByDate, entryCache, addMonths(visibleMonth, -1)),
    [dateNoteByDate, entryCache, visibleMonth],
  );
  const currentChartMonth = useMemo(
    () => getChartMonthDataFromCache(dateNoteByDate, entryCache, visibleMonth),
    [dateNoteByDate, entryCache, visibleMonth],
  );
  const nextChartMonth = useMemo(
    () => getChartMonthDataFromCache(dateNoteByDate, entryCache, addMonths(visibleMonth, 1)),
    [dateNoteByDate, entryCache, visibleMonth],
  );
  const selectedDateNote = dateNoteByDate.get(selectedDate)?.note ?? "";

  useEffect(() => {
    const nextActiveBookId = activeBook?.id ?? null;
    if (previousActiveBookId.current === nextActiveBookId) {
      return;
    }

    previousActiveBookId.current = nextActiveBookId;
    setEditingEntryId(null);
    setDraft(createDraft(selectedDate, session.user.id));
  }, [activeBook?.id, selectedDate, session.user.id]);

  const resetEditor = (isoDate: string) => {
    setSelectedDate(isoDate);
    setEditingEntryId(null);
    setDraft(createDraft(isoDate, session.user.id));
  };

  const handleSelectDate = (isoDate: string) => {
    const nextMonth = startOfMonth(parseIsoDate(isoDate));
    setVisibleMonth((currentMonth) =>
      getMonthKey(currentMonth) === getMonthKey(nextMonth) ? currentMonth : nextMonth,
    );
    resetEditor(isoDate);
  };

  const handleSaveEntry = async () => {
    const savedEntries = await persistDraftEntry(draft, editingEntryId);
    if (savedEntries.length === 0) {
      return [];
    }

    resetEditor(draft.date);
    return savedEntries;
  };

  const persistDraftEntry = async (
    draftToSave: LedgerEntryDraft,
    targetEditingEntryId: string | null,
  ): Promise<LedgerEntry[]> => {
    if (!activeBook) {
      return [];
    }

    if (!canSubmitDraft(draftToSave)) {
      return [];
    }

    if (targetEditingEntryId) {
      const nextEntry: LedgerEntry = {
        id: targetEditingEntryId,
        date: draftToSave.date,
        type: draftToSave.type,
        amount: Number(draftToSave.amount),
        targetMemberId: draftToSave.targetMemberId,
        targetMemberName: draftToSave.targetMemberName,
        content: draftToSave.content.trim(),
        category: draftToSave.category.trim(),
        note: draftToSave.note.trim(),
        photoAttachments: draftToSave.photoAttachments,
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
        currentEntries.map((entry) => (entry.id === savedEntry.id ? savedEntry : entry)),
      );
      return [savedEntry];
    }

    const entriesToSave = buildLedgerEntriesFromDraft(draftToSave);
    const savedEntries = await saveLedgerEntries({
      activeBookId: activeBook.id,
      entries: entriesToSave,
      trackBusyTask,
      userId: session.user.id,
    });
    setEntries((currentEntries) => mergeEntries(currentEntries, savedEntries));

    return savedEntries;
  };

  const handleDeleteEntry = async (entryId: string) => {
    await removeLedgerEntry(entryId, trackBusyTask);
    setEntries((currentEntries) => currentEntries.filter((entry) => entry.id !== entryId));
    if (editingEntryId === entryId) {
      resetEditor(selectedDate);
    }
  };

  const handleSettleInstallmentEntry = async (entry: LedgerEntry) => {
    const currentInstallmentOrder = entry.installmentOrder;
    if (
      !activeBook ||
      !entry.installmentGroupId ||
      !entry.installmentMonths ||
      !currentInstallmentOrder ||
      currentInstallmentOrder >= entry.installmentMonths
    ) {
      return null;
    }

    const installmentEntries = await loadInstallmentEntries(
      activeBook.id,
      entry.installmentGroupId,
      trackBusyTask,
    );
    const futureEntries = installmentEntries.filter(
      (installmentEntry) =>
        installmentEntry.installmentOrder &&
        installmentEntry.installmentOrder > currentInstallmentOrder,
    );

    if (futureEntries.length === 0) {
      return null;
    }

    const remainingAmount = futureEntries.reduce(
      (totalAmount, futureEntry) => totalAmount + futureEntry.amount,
      0,
    );
    const settlementEntry = buildInstallmentSettlementEntry(entry, remainingAmount);

    await removeLedgerEntries(
      futureEntries.map((futureEntry) => futureEntry.id),
      trackBusyTask,
    );
    const [savedSettlementEntry] = await saveLedgerEntries({
      activeBookId: activeBook.id,
      entries: [settlementEntry],
      trackBusyTask,
      userId: session.user.id,
    });

    if (!savedSettlementEntry) {
      return null;
    }

    setEntries((currentEntries) =>
      mergeEntries(
        currentEntries.filter(
          (currentEntry) =>
            !futureEntries.some((futureEntry) => futureEntry.id === currentEntry.id),
        ),
        [savedSettlementEntry],
      ),
    );

    return savedSettlementEntry;
  };

  const handleEditEntry = (entry: LedgerEntry) => {
    setEditingEntryId(entry.id);
    setSelectedDate(entry.date);
    setDraft({
      date: entry.date,
      type: entry.type,
      amount: String(entry.amount),
      targetMemberId: entry.targetMemberId ?? entry.authorId ?? session.user.id,
      targetMemberName: entry.targetMemberName ?? entry.authorName,
      content: entry.content,
      category: entry.category,
      installmentMonths: entry.installmentMonths ?? 1,
      note: entry.note,
      photoAttachments: entry.photoAttachments,
    });
  };

  const errorMessage = activeBookError ?? entriesError ?? selectedEntriesError;
  const handleRefreshLedger = async () => {
    await Promise.all([refreshLedger(), refreshLedgerDayNotes(), refreshSelectedDateEntries()]);
  };
  const handleSaveSelectedDateNote = async (note: string) => {
    await saveLedgerDayNote(selectedDate, note);
  };
  const handleDeleteSelectedDateNote = async () => {
    await removeLedgerDayNote(selectedDate);
  };

  return {
    activeBook,
    accessibleBooks,
    currentChartMonth,
    draft,
    editingEntryId,
    errorMessage,
    entries,
    isBusy: busyTaskCount > 0,
    isLoading: isLoadingBook || isLoadingEntries,
    isLoadingSelectedDateEntries,
    isRefreshing,
    joinSharedLedgerBookByCode,
    createLedgerBook,
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
    renameActiveLedgerBook,
    refreshLedger: handleRefreshLedger,
    refreshSharedLedgerBook,
    selectedDate,
    selectedDateNote,
    selectedEntries,
    setVisibleMonth,
    switchLedgerBook,
    visibleMonth,
    handleDeleteSelectedDateNote,
    handleDeleteEntry,
    handleEditEntry,
    handleSaveSelectedDateNote,
    handleSaveEntry,
    handleSettleInstallmentEntry,
    handleSelectDate,
    resetEditor,
    updateDraftField: (field, value) =>
      setDraft((currentDraft) => ({
        ...currentDraft,
        [field]: field === "amount" ? sanitizeAmountInput(value) : value,
      })),
    updateDraftInstallmentMonths: (installmentMonths) =>
      setDraft((currentDraft) => ({ ...currentDraft, installmentMonths })),
    updateDraftPhotoAttachments: (nextPhotoAttachments: LedgerEntryPhotoAttachment[]) =>
      setDraft((currentDraft) => ({ ...currentDraft, photoAttachments: nextPhotoAttachments })),
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
