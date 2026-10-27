import { useTrackedTask } from "./useTrackedTask";
import { createLedgerEntryActions } from "./ledgerScreenState/ledgerEntryActions";
import { useLedgerEditor } from "./ledgerScreenState/useLedgerEditor";
import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWindowDimensions } from "react-native";

import type { MonthPage } from "../components/monthCalendarPager/monthCalendarPagerUtils";
import { type CalendarSummaryMode, CalendarSummaryModes } from "../constants/calendarSummary";
import type { SubscriptionTier } from "../constants/subscription";
import { AppTextScale, resolveTextScale } from "../constants/textLayout";
import { isLedgerBookEditableWithinPlanLimit } from "../lib/ledgerEditability";
import { fetchLedgerEntriesSummary } from "../lib/ledgerEntries";
import { logAppError } from "../lib/logAppError";
import type { LedgerEntry } from "../types/ledger";
import { addMonths, startOfMonth } from "../utils/calendar";
import { buildLedgerEntryListSignature } from "../utils/ledgerEntrySignature";
import { buildSelectedMonthSummaryRangeForMonth } from "../utils/calendarSummaryRange";
import {
  getChartMonthDataFromCache,
  getMonthPageFromCache,
  getMonthlyInsightsFromCache,
  getMonthlyLedgerFromCache,
} from "./ledgerScreenState/calendarMonthData";
import type { LedgerScreenState } from "./ledgerScreenState/types";
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
  const [visibleChartMonth, setVisibleChartMonth] = useState(actualToday);
  const [allChartEntries, setAllChartEntries] = useState<LedgerEntry[] | null>(null);
  const [ledgerMutationRevision, setLedgerMutationRevision] = useState(0);
  const { taskCount: busyTaskCount, trackTask: trackBusyTask } = useTrackedTask();
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
  const editor = useLedgerEditor(session.user.id, activeBook?.id ?? null, setVisibleMonth);
  const {
    draft,
    editingEntryId,
    selectedDate,
    resetEditor,
    prepareDraftEntry,
    handleSelectDate,
    handleEditEntry,
  } = editor;
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
  const entryData = useLedgerEntries(activeBook?.id ?? null, visibleMonth, initialEntryBootstrap);
  const {
    entries,
    entriesError,
    entryCache,
    isLoadingEntries,
    isLoadingChartEntries,
    isRefreshing,
    preloadChartEntries,
    refreshLedger,
  } = entryData;
  const selectedDateSummaryEntries = useMemo(
    () => entries.filter((entry) => entry.date === selectedDate),
    [entries, selectedDate],
  );
  const selectedDateEntrySignature = useMemo(
    () => buildLedgerEntryListSignature(selectedDateSummaryEntries),
    [selectedDateSummaryEntries],
  );
  const selectedDateData = useSelectedDateEntries(
    activeBook?.id ?? null,
    selectedDate,
    selectedDateEntrySignature,
  );
  const {
    isLoadingSelectedDateEntries,
    refreshSelectedDateEntries,
    selectedEntries,
    selectedEntriesError,
  } = selectedDateData;
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
      ? (selectedMonthSummaryRange?.startDate ?? null)
      : null;
  const totalSummaryDateTo =
    calendarSummaryMode === CalendarSummaryModes.selectedMonth
      ? (selectedMonthSummaryRange?.endDate ?? null)
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
    () =>
      getChartMonthDataFromCache(entryCache, addMonths(visibleChartMonth, -1), chartDataOptions),
    [chartDataOptions, entryCache, visibleChartMonth],
  );
  const currentChartMonth = useMemo(
    () => getChartMonthDataFromCache(entryCache, visibleChartMonth, chartDataOptions),
    [chartDataOptions, entryCache, visibleChartMonth],
  );
  const nextChartMonth = useMemo(
    () => getChartMonthDataFromCache(entryCache, addMonths(visibleChartMonth, 1), chartDataOptions),
    [chartDataOptions, entryCache, visibleChartMonth],
  );
  const preloadVisibleChartEntries = useCallback(
    () => preloadChartEntries(visibleChartMonth),
    [preloadChartEntries, visibleChartMonth],
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

  const {
    handleSaveEntry,
    handleDeleteEntry,
    previewInstallmentPrepayment,
    prepayInstallmentEntry,
  } = createLedgerEntryActions({
    session,
    activeBook,
    entries,
    editor,
    trackBusyTask,
    blockReadOnlyEditIfNeeded,
    entryData,
    selectedDateData,
    setAllChartEntries,
    setLedgerMutationRevision,
  });

  const errorMessage = activeBookError ?? entriesError ?? selectedEntriesError;
  const handleRefreshLedger = async (invalidateCachedMonths = false) => {
    if (invalidateCachedMonths) setLedgerMutationRevision((currentRevision) => currentRevision + 1);
    await Promise.all([refreshLedger(invalidateCachedMonths), refreshSelectedDateEntries()]);
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
    isLoadingChartEntries,
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
    preloadChartEntries: preloadVisibleChartEntries,
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
    setVisibleChartMonth,
    visibleChartMonth,
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
    updateDraftField: editor.updateDraftField,
    updateDraftInstallmentMonths: editor.updateDraftInstallmentMonths,
    updateDraftPhotoAttachments: editor.updateDraftPhotoAttachments,
    updateDraftType: editor.updateDraftType,
  };
}
