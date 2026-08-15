import type { Session } from "@supabase/supabase-js";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useWindowDimensions } from "react-native";

import type { MonthPage } from "../components/monthCalendarPager/monthCalendarPagerUtils";
import {
  type CalendarSummaryMode,
  CalendarSummaryModes,
} from "../constants/calendarSummary";
import { InstallmentStatuses } from "../constants/installments";
import { DEFAULT_MEMBER_DISPLAY_NAME } from "../constants/ledgerDisplay";
import type { SubscriptionTier } from "../constants/subscription";
import { AppTextScale, resolveTextScale } from "../constants/textLayout";
import { buildLedgerEntriesFromDraft } from "../lib/installments";
import {
  deleteInstallmentGroup,
  prepayInstallmentGroup,
} from "../lib/installmentTransactions";
import { isLedgerBookEditableWithinPlanLimit } from "../lib/ledgerEditability";
import { fetchLedgerEntriesSummary } from "../lib/ledgerEntries";
import { logAppError } from "../lib/logAppError";
import type { LedgerEntry, LedgerEntryDraft, LedgerEntryPhotoAttachment } from "../types/ledger";
import {
  LedgerEntryDeleteScopes,
  type LedgerEntryDeleteScope,
} from "../types/ledgerEntryDeletion";
import { addMonths, getMonthKey, parseIsoDate, startOfMonth, toIsoDate } from "../utils/calendar";
import {
  canSubmitDraft,
  createDraft,
  mergeEntries,
  sanitizeAmountInput,
} from "../utils/ledgerEntries";
import { buildLedgerEntryListSignature } from "../utils/ledgerEntrySignature";
import { resolveFallbackDisplayName } from "../utils/sessionDisplayName";
import { buildSelectedMonthSummaryRangeForMonth } from "../utils/calendarSummaryRange";
import {
  getChartMonthDataFromCache,
  getMonthPageFromCache,
  getMonthlyInsightsFromCache,
  getMonthlyLedgerFromCache,
} from "./ledgerScreenState/calendarMonthData";
import {
  loadInstallmentEntries,
  removeLedgerEntry,
  saveLedgerEntries,
  saveLedgerEntry,
} from "./ledgerScreenState/helpers";
import type { BusyTaskTracker, LedgerScreenState } from "./ledgerScreenState/types";
import { useActiveLedgerBook } from "./ledgerScreenState/useActiveLedgerBook";
import { useLedgerEntries } from "./ledgerScreenState/useLedgerEntries";
import { useLedgerJoinRequests } from "./ledgerScreenState/useLedgerJoinRequests";
import { useSelectedDateEntries } from "./ledgerScreenState/useSelectedDateEntries";
import { useLedgerBookTotalSummary } from "./useLedgerBookTotalSummary";

export type { LedgerScreenState } from "./ledgerScreenState/types";

type LedgerScreenStateOptions = {
  calendarSummaryBaseDay?: number | null;
  calendarSummaryMode?: CalendarSummaryMode;
  onReadOnlyEditBlocked?: () => void;
  subscriptionTier: SubscriptionTier;
};

export function useLedgerScreenState(
  session: Session,
  {
    calendarSummaryBaseDay = null,
    calendarSummaryMode = CalendarSummaryModes.monthly,
    onReadOnlyEditBlocked,
    subscriptionTier,
  }: LedgerScreenStateOptions,
): LedgerScreenState {
  const { fontScale } = useWindowDimensions();
  const calendarFontScale = resolveTextScale(fontScale, AppTextScale.compact);
  const actualToday = startOfMonth(new Date());
  const initialBootstrapMonth = useRef(actualToday).current;
  const [visibleMonth, setVisibleMonth] = useState(actualToday);
  const [selectedDate, setSelectedDate] = useState(() => toIsoDate(new Date()));
  const [allChartEntries, setAllChartEntries] = useState<LedgerEntry[] | null>(null);
  const [ledgerMutationRevision, setLedgerMutationRevision] = useState(0);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingEntrySnapshot, setEditingEntrySnapshot] = useState<LedgerEntry | null>(null);
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
    deleteActiveLedgerBook,
    isLoadingBook,
    initialEntryBootstrap,
    joinSharedLedgerBookByCode,
    leaveSharedLedgerBook,
    previewSharedLedgerBookJoinByCode,
    refreshExpiredShareCode,
    removeSharedLedgerMember,
    renameActiveLedgerBook,
    refreshSharedLedgerBook,
    switchLedgerBook,
    transferSharedLedgerOwnership,
  } = useActiveLedgerBook(session.user.id, trackBusyTask, initialBootstrapMonth);
  const isReadOnlyDueToPlanLimit =
    Boolean(activeBook) &&
    !isLedgerBookEditableWithinPlanLimit(subscriptionTier, accessibleBooks, activeBook?.id);
  const blockReadOnlyEditIfNeeded = () => {
    if (!isReadOnlyDueToPlanLimit) {
      return false;
    }

    onReadOnlyEditBlocked?.();
    return true;
  };
  const {
    approveLedgerJoinRequest,
    pendingJoinRequestCountsByBookId,
    pendingJoinRequests,
    rejectLedgerJoinRequest,
  } = useLedgerJoinRequests(activeBook, accessibleBooks, session.user.id, trackBusyTask);
  const {
    entries,
    entriesError,
    entryCache,
    isLoadingEntries,
    isRefreshing,
    preloadChartEntries,
    refreshLedger,
    removeEntriesFromCache,
    replaceInstallmentGroupInCache,
    setEntries,
  } = useLedgerEntries(activeBook?.id ?? null, visibleMonth, initialEntryBootstrap);
  const selectedDateSummaryEntries = useMemo(
    () => entries.filter((entry) => entry.date === selectedDate),
    [entries, selectedDate],
  );
  const selectedDateEntrySignature = useMemo(
    () => buildLedgerEntryListSignature(selectedDateSummaryEntries),
    [selectedDateSummaryEntries],
  );
  const {
    isLoadingSelectedDateEntries,
    removeSelectedDateEntries,
    refreshSelectedDateEntries,
    selectedEntries,
    selectedEntriesError,
  } = useSelectedDateEntries(activeBook?.id ?? null, selectedDate, selectedDateEntrySignature);
  const totalSummaryRefreshKey = useMemo(
    () =>
      JSON.stringify([
        buildLedgerEntryListSignature(Object.values(entryCache).flat()),
        ledgerMutationRevision,
      ]),
    [entryCache, ledgerMutationRevision],
  );
  const selectedMonthSummaryRange = useMemo(
    () =>
      calendarSummaryBaseDay
        ? buildSelectedMonthSummaryRangeForMonth(visibleMonth, calendarSummaryBaseDay)
        : null,
    [calendarSummaryBaseDay, visibleMonth],
  );
  const totalSummaryDateFrom =
    calendarSummaryMode === CalendarSummaryModes.selectedMonth
      ? selectedMonthSummaryRange?.startDate ?? null
      : null;
  const totalSummaryDateTo =
    calendarSummaryMode === CalendarSummaryModes.selectedMonth
      ? selectedMonthSummaryRange?.endDate ?? null
      : null;
  const isTotalSummaryEnabled =
    calendarSummaryMode === CalendarSummaryModes.all ||
    (calendarSummaryMode === CalendarSummaryModes.selectedMonth &&
      selectedMonthSummaryRange !== null);
  const { isLoadingTotalSummary, totalLedgerSummary } = useLedgerBookTotalSummary(
    activeBook?.id ?? null,
    isTotalSummaryEnabled,
    totalSummaryRefreshKey,
    totalSummaryDateFrom,
    totalSummaryDateTo,
  );

  const monthlyLedger = useMemo(
    () => getMonthlyLedgerFromCache(entryCache, visibleMonth),
    [entryCache, visibleMonth],
  );
  const monthlyInsights = useMemo(
    () => getMonthlyInsightsFromCache(entryCache, visibleMonth),
    [entryCache, visibleMonth],
  );
  const chartDataOptions = useMemo(
    () => ({
      allEntries: allChartEntries ?? undefined,
      calendarSummaryBaseDay,
      calendarSummaryMode,
    }),
    [allChartEntries, calendarSummaryBaseDay, calendarSummaryMode],
  );
  const previousMonthPage = useMemo<MonthPage>(
    () => getMonthPageFromCache(entryCache, addMonths(visibleMonth, -1), calendarFontScale),
    [calendarFontScale, entryCache, visibleMonth],
  );
  const currentMonthPage = useMemo<MonthPage>(
    () => getMonthPageFromCache(entryCache, visibleMonth, calendarFontScale),
    [calendarFontScale, entryCache, visibleMonth],
  );
  const nextMonthPage = useMemo<MonthPage>(
    () => getMonthPageFromCache(entryCache, addMonths(visibleMonth, 1), calendarFontScale),
    [calendarFontScale, entryCache, visibleMonth],
  );
  const previousChartMonth = useMemo(
    () => getChartMonthDataFromCache(entryCache, addMonths(visibleMonth, -1), chartDataOptions),
    [chartDataOptions, entryCache, visibleMonth],
  );
  const currentChartMonth = useMemo(
    () => getChartMonthDataFromCache(entryCache, visibleMonth, chartDataOptions),
    [chartDataOptions, entryCache, visibleMonth],
  );
  const nextChartMonth = useMemo(
    () => getChartMonthDataFromCache(entryCache, addMonths(visibleMonth, 1), chartDataOptions),
    [chartDataOptions, entryCache, visibleMonth],
  );

  useEffect(() => {
    const activeBookId = activeBook?.id ?? null;
    if (calendarSummaryMode !== CalendarSummaryModes.all || !activeBookId) {
      setAllChartEntries(null);
      return;
    }

    let isMounted = true;
    void fetchLedgerEntriesSummary(activeBookId)
      .then((nextEntries) => {
        if (isMounted) {
          setAllChartEntries(nextEntries);
        }
      })
      .catch((error) => {
        logAppError("LedgerScreenState", error, {
          activeBookId,
          step: "fetch_all_chart_entries",
        });
        if (isMounted) {
          setAllChartEntries([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeBook?.id, calendarSummaryMode, totalSummaryRefreshKey]);

  useEffect(() => {
    const nextActiveBookId = activeBook?.id ?? null;
    if (previousActiveBookId.current === nextActiveBookId) {
      return;
    }

    previousActiveBookId.current = nextActiveBookId;
    setEditingEntryId(null);
    setEditingEntrySnapshot(null);
    setDraft(createDraft(selectedDate, session.user.id));
  }, [activeBook?.id, selectedDate, session.user.id]);

  const resetEditor = (isoDate: string) => {
    setSelectedDate(isoDate);
    setEditingEntryId(null);
    setEditingEntrySnapshot(null);
    setDraft(createDraft(isoDate, session.user.id));
  };

  const prepareDraftEntry = (nextDraft: LedgerEntryDraft) => {
    setSelectedDate(nextDraft.date);
    setEditingEntryId(null);
    setEditingEntrySnapshot(null);
    setDraft(nextDraft);
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
    if (blockReadOnlyEditIfNeeded()) {
      return [];
    }

    if (!activeBook) {
      return [];
    }

    if (!canSubmitDraft(draftToSave)) {
      return [];
    }

    if (targetEditingEntryId) {
      const sourceEntry =
        editingEntrySnapshot?.id === targetEditingEntryId
          ? editingEntrySnapshot
          : entries.find((entry) => entry.id === targetEditingEntryId);
      const authorName =
        sourceEntry?.authorName ?? resolveCurrentUserDisplayName(session, entries);
      const nextEntry: LedgerEntry = {
        ...sourceEntry,
        authorId: sourceEntry?.authorId ?? session.user.id,
        authorHasBookAccess: sourceEntry?.authorHasBookAccess ?? true,
        authorName,
        id: targetEditingEntryId,
        date: draftToSave.date,
        type: draftToSave.type,
        amount: Number(draftToSave.amount),
        targetMemberId: draftToSave.targetMemberId,
        targetMemberHasBookAccess: sourceEntry?.targetMemberHasBookAccess ?? true,
        targetMemberName:
          draftToSave.targetMemberName ??
          (draftToSave.targetMemberId === session.user.id ? authorName : undefined),
        content: draftToSave.content.trim(),
        category: draftToSave.category.trim(),
        categoryId: draftToSave.categoryId.trim(),
        note: draftToSave.note.trim(),
        photoAttachments: draftToSave.photoAttachments,
        sourceType: "manual",
      };

      const savedEntry = await saveLedgerEntry({
        activeBookId: activeBook.id,
        editingEntryId: targetEditingEntryId,
        entry: nextEntry,
        syncPhotoAttachments: havePhotoAttachmentsChanged(
          sourceEntry?.photoAttachments ?? [],
          draftToSave.photoAttachments,
        ),
        trackBusyTask,
        userId: session.user.id,
      });
      setEntries((currentEntries) =>
        currentEntries.map((entry) => (entry.id === savedEntry.id ? savedEntry : entry)),
      );
      return [savedEntry];
    }

    const authorName = resolveCurrentUserDisplayName(session, entries);
    const entriesToSave = buildLedgerEntriesFromDraft(draftToSave).map((entry) => ({
      ...entry,
      authorHasBookAccess: true,
      authorId: session.user.id,
      authorName,
      targetMemberHasBookAccess: true,
      targetMemberName:
        entry.targetMemberName ??
        (entry.targetMemberId === session.user.id ? authorName : undefined),
    }));
    const savedEntries = await saveLedgerEntries({
      activeBookId: activeBook.id,
      entries: entriesToSave,
      trackBusyTask,
      userId: session.user.id,
    });
    setEntries((currentEntries) => mergeEntries(currentEntries, savedEntries));

    return savedEntries;
  };

  const handleDeleteEntry = async (entry: LedgerEntry, scope: LedgerEntryDeleteScope) => {
    if (blockReadOnlyEditIfNeeded()) {
      return [];
    }

    if (entry.installmentStatus === InstallmentStatuses.prepaid && !entry.installmentGroupId) {
      return [];
    }

    let entriesToDelete = [entry];
    let deletedEntryIds = [entry.id];
    const installmentGroupId = entry.installmentGroupId;
    if (
      (scope === LedgerEntryDeleteScopes.installmentGroup ||
        entry.installmentStatus === InstallmentStatuses.prepaid) &&
      activeBook &&
      installmentGroupId
    ) {
      entriesToDelete = await loadInstallmentEntries(
        activeBook.id,
        installmentGroupId,
        trackBusyTask,
      );
      deletedEntryIds = await trackBusyTask(() =>
        deleteInstallmentGroup(activeBook.id, installmentGroupId),
      );
    } else {
      await removeLedgerEntry(entry.id);
    }

    const deletedEntryIdSet = new Set(deletedEntryIds);
    removeEntriesFromCache(deletedEntryIds);
    removeSelectedDateEntries(deletedEntryIds);
    setAllChartEntries((currentEntries) =>
      currentEntries?.filter((currentEntry) => !deletedEntryIdSet.has(currentEntry.id)) ?? null,
    );
    if (editingEntryId && deletedEntryIdSet.has(editingEntryId)) {
      resetEditor(selectedDate);
    }
    setLedgerMutationRevision((currentRevision) => currentRevision + 1);

    return entriesToDelete;
  };

  const previewInstallmentPrepayment = async (
    entry: LedgerEntry,
    prepaymentDate: string,
  ) => {
    if (
      blockReadOnlyEditIfNeeded() ||
      !activeBook ||
      !entry.installmentGroupId ||
      entry.installmentStatus === InstallmentStatuses.prepaid
    ) {
      return null;
    }

    const installmentEntries = await loadInstallmentEntries(
      activeBook.id,
      entry.installmentGroupId,
      trackBusyTask,
    );
    const futureEntries = installmentEntries.filter(
      (installmentEntry) => installmentEntry.date > prepaymentDate,
    );
    if (futureEntries.length === 0) {
      return null;
    }

    return {
      installmentCount: futureEntries.length,
      totalAmount: futureEntries.reduce(
        (totalAmount, futureEntry) => totalAmount + futureEntry.amount,
        0,
      ),
    };
  };

  const prepayInstallmentEntry = async (
    entry: LedgerEntry,
    prepaymentDate: string,
  ) => {
    const installmentGroupId = entry.installmentGroupId;
    if (
      blockReadOnlyEditIfNeeded() ||
      !activeBook ||
      !installmentGroupId ||
      entry.installmentStatus === InstallmentStatuses.prepaid
    ) {
      return null;
    }

    const transactionResult = await trackBusyTask(() =>
      prepayInstallmentGroup(activeBook.id, installmentGroupId, prepaymentDate),
    );
    const updatedEntries = await loadInstallmentEntries(
      activeBook.id,
      installmentGroupId,
      trackBusyTask,
      true,
    );

    replaceInstallmentGroupInCache(installmentGroupId, updatedEntries);
    await refreshSelectedDateEntries();
    setAllChartEntries((currentEntries) =>
      currentEntries
        ? mergeEntries(
            currentEntries.filter(
              (currentEntry) => currentEntry.installmentGroupId !== installmentGroupId,
            ),
            updatedEntries,
          )
        : null,
    );
    setLedgerMutationRevision((currentRevision) => currentRevision + 1);

    return {
      deletedEntryIds: transactionResult.deletedEntryIds,
      installmentCount: transactionResult.installmentCount,
      prepaidEntryId: transactionResult.prepaidEntryId,
      totalAmount: transactionResult.totalAmount,
      updatedEntries,
    };
  };

  const handleEditEntry = (entry: LedgerEntry) => {
    setEditingEntryId(entry.id);
    setEditingEntrySnapshot(entry);
    setSelectedDate(entry.date);
    setDraft({
      date: entry.date,
      type: entry.type,
      amount: String(entry.amount),
      targetMemberId: entry.targetMemberId ?? entry.authorId ?? session.user.id,
      targetMemberName: entry.targetMemberName ?? entry.authorName,
      content: entry.content,
      category: entry.category,
      categoryId: entry.categoryId,
      installmentMonths: entry.installmentMonths ?? 1,
      note: entry.note,
      photoAttachments: entry.photoAttachments,
    });
  };

  const errorMessage = activeBookError ?? entriesError ?? selectedEntriesError;
  const handleRefreshLedger = async () => {
    await Promise.all([refreshLedger(), refreshSelectedDateEntries()]);
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
    isLoadingTotalSummary,
    isReadOnlyDueToPlanLimit,
    isRefreshing,
    joinSharedLedgerBookByCode,
    createLedgerBook,
    deleteActiveLedgerBook,
    leaveSharedLedgerBook,
    currentMonthPage,
    monthlyLedger,
    monthlyInsights,
    nextMonthPage,
    nextChartMonth,
    pendingJoinRequestCountsByBookId,
    pendingJoinRequests,
    previousMonthPage,
    previousChartMonth,
    preloadChartEntries,
    previewSharedLedgerBookJoinByCode,
    refreshExpiredShareCode,
    approveLedgerJoinRequest,
    rejectLedgerJoinRequest,
    removeSharedLedgerMember,
    renameActiveLedgerBook,
    refreshLedger: handleRefreshLedger,
    refreshSharedLedgerBook,
    selectedDate,
    selectedEntries,
    selectedMonthSummaryDate: selectedMonthSummaryRange?.startDate ?? null,
    selectedMonthSummaryLabel: selectedMonthSummaryRange?.label ?? null,
    setVisibleMonth,
    switchLedgerBook,
    transferSharedLedgerOwnership,
    totalLedgerSummary,
    visibleMonth,
    handleDeleteEntry,
    handleEditEntry,
    handleSaveEntry,
    prepayInstallmentEntry,
    previewInstallmentPrepayment,
    handleSelectDate,
    prepareDraftEntry,
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
      setDraft((currentDraft) => ({ ...currentDraft, category: "", categoryId: "", type })),
  };
}

function havePhotoAttachmentsChanged(
  currentAttachments: LedgerEntryPhotoAttachment[],
  nextAttachments: LedgerEntryPhotoAttachment[],
): boolean {
  if (currentAttachments.length !== nextAttachments.length) {
    return true;
  }

  return currentAttachments.some((currentAttachment, index) => {
    const nextAttachment = nextAttachments[index];
    return (
      !nextAttachment ||
      currentAttachment.id !== nextAttachment.id ||
      currentAttachment.uri !== nextAttachment.uri ||
      currentAttachment.fileName !== nextAttachment.fileName ||
      currentAttachment.mimeType !== nextAttachment.mimeType
    );
  });
}

function resolveCurrentUserDisplayName(session: Session, entries: LedgerEntry[]): string {
  const cachedEntryName = entries.find((entry) => entry.authorId === session.user.id)?.authorName;
  return (
    cachedEntryName?.trim() ||
    resolveFallbackDisplayName(session.user.user_metadata, session.user.email).trim() ||
    DEFAULT_MEMBER_DISPLAY_NAME
  );
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
