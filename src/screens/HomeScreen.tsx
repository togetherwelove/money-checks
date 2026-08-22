import { useIsFocused } from "@react-navigation/native";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppBannerAd } from "../components/AppBannerAd";
import { MonthCalendarPager } from "../components/MonthCalendarPager";
import { MonthlySummary } from "../components/MonthlySummary";
import { WeekdayHeader } from "../components/WeekdayHeader";
import { HomeTransactionList } from "../components/homeScreen/HomeTransactionList";
import type { MonthOffset } from "../components/monthCalendarPager/monthCalendarPagerTypes";
import {
  type CalendarSummaryMode,
  CalendarSummaryLabels,
  CalendarSummaryLoadingLabel,
  CalendarSummaryModes,
  formatCalendarMonthlySummaryLabel,
} from "../constants/calendarSummary";
import { AppColors } from "../constants/colors";
import { HomeScreenUi } from "../constants/home";
import { AppLayout } from "../constants/layout";
import { formatMonthLabel } from "../constants/ledgerDisplay";
import { AppMessages } from "../constants/messages";
import {
  FullBleedHorizontalStyle,
} from "../constants/uiStyles";
import type { LedgerScreenState } from "../hooks/useLedgerScreenState";
import type { LedgerEntry } from "../types/ledger";
import type { LedgerEntryDeleteHandler } from "../types/ledgerEntryDeletion";
import type { InstallmentPrepaymentHandler } from "../types/installmentTransactions";
import {
  addMonths,
  formatCurrency,
  parseIsoDate,
  startOfMonth,
  toIsoDate,
} from "../utils/calendar";

type HomeScreenProps = {
  calendarSummaryMode: CalendarSummaryMode;
  onDeleteSelectedEntry: LedgerEntryDeleteHandler;
  onEditSelectedEntry: (entry: LedgerEntry) => void;
  onPrepayInstallmentEntry: InstallmentPrepaymentHandler;
  onSelectCalendarDate: (isoDate: string) => void;
  screenTitle: ReactNode;
  isCalendarHeatmapEnabled: boolean;
  showsBannerAd: boolean;
  state: LedgerScreenState;
};

type DisplayedSummary = {
  balanceAmount: number;
  balanceLabel?: string;
  summaryLabel: string;
  totalExpense: string;
  totalIncome: string;
};

export function HomeScreen({
  calendarSummaryMode,
  onDeleteSelectedEntry,
  onEditSelectedEntry,
  onPrepayInstallmentEntry,
  onSelectCalendarDate,
  screenTitle,
  isCalendarHeatmapEnabled,
  showsBannerAd,
  state,
}: HomeScreenProps) {
  const todayIsoDate = toIsoDate(new Date());
  const isScreenFocused = useIsFocused();
  const [calendarFocusRevision, setCalendarFocusRevision] = useState(0);
  const wasScreenFocusedRef = useRef(isScreenFocused);
  const {
    errorMessage,
    isLoadingSelectedDateEntries,
    isRefreshing,
    refreshLedger,
    selectedDate,
    selectedEntries,
    visibleMonth,
  } = state;

  useEffect(() => {
    if (!wasScreenFocusedRef.current && isScreenFocused) {
      setCalendarFocusRevision((currentRevision) => currentRevision + 1);
    }
    wasScreenFocusedRef.current = isScreenFocused;
  }, [isScreenFocused]);

  return (
    <View style={styles.screen}>
      <KeyboardAwareContent
        errorMessage={errorMessage}
        calendarFocusRevision={calendarFocusRevision}
        calendarSummaryMode={calendarSummaryMode}
        isCalendarHeatmapEnabled={isCalendarHeatmapEnabled}
        isLoadingSelectedDateEntries={isLoadingSelectedDateEntries}
        isRefreshing={isRefreshing}
        isReadOnlyDueToPlanLimit={state.isReadOnlyDueToPlanLimit}
        onDeleteSelectedEntry={onDeleteSelectedEntry}
        onEditSelectedEntry={onEditSelectedEntry}
        onPrepayInstallmentEntry={onPrepayInstallmentEntry}
        onRefreshLedger={refreshLedger}
        onSelectCalendarDate={onSelectCalendarDate}
        screenTitle={screenTitle}
        selectedDate={selectedDate}
        selectedEntries={selectedEntries}
        showsBannerAd={showsBannerAd}
        state={state}
        todayIsoDate={todayIsoDate}
        visibleMonth={visibleMonth}
      />
    </View>
  );
}

function KeyboardAwareContent({
  errorMessage,
  calendarFocusRevision,
  calendarSummaryMode,
  isCalendarHeatmapEnabled,
  isLoadingSelectedDateEntries,
  isRefreshing,
  isReadOnlyDueToPlanLimit,
  onDeleteSelectedEntry,
  onEditSelectedEntry,
  onPrepayInstallmentEntry,
  onRefreshLedger,
  onSelectCalendarDate,
  screenTitle,
  selectedDate,
  selectedEntries,
  showsBannerAd,
  state,
  todayIsoDate,
  visibleMonth,
}: {
  errorMessage: string | null;
  calendarFocusRevision: number;
  calendarSummaryMode: CalendarSummaryMode;
  isCalendarHeatmapEnabled: boolean;
  isLoadingSelectedDateEntries: boolean;
  isRefreshing: boolean;
  isReadOnlyDueToPlanLimit: boolean;
  onDeleteSelectedEntry: LedgerEntryDeleteHandler;
  onEditSelectedEntry: (entry: LedgerEntry) => void;
  onPrepayInstallmentEntry: InstallmentPrepaymentHandler;
  onRefreshLedger: () => Promise<void>;
  onSelectCalendarDate: (isoDate: string) => void;
  screenTitle: ReactNode;
  selectedDate: string;
  selectedEntries: LedgerEntry[];
  showsBannerAd: boolean;
  state: LedgerScreenState;
  todayIsoDate: string;
  visibleMonth: Date;
}) {
  const displayedSummary = resolveDisplayedSummary(state, calendarSummaryMode);
  const [previewMonthOffset, setPreviewMonthOffset] = useState<MonthOffset>(0);
  const displayedCalendarMonth =
    previewMonthOffset === 0 ? visibleMonth : addMonths(visibleMonth, previewMonthOffset);
  const handleMoveMonth = useCallback(
    (monthOffset: MonthOffset) => {
      setPreviewMonthOffset(0);
      moveMonth(visibleMonth, monthOffset, state.handleSelectDate, todayIsoDate);
    },
    [state.handleSelectDate, todayIsoDate, visibleMonth],
  );

  useEffect(() => {
    setPreviewMonthOffset(0);
  }, [visibleMonth]);

  return (
    <View style={styles.screenContent}>
      <View>
        {screenTitle}
        {errorMessage ? (
          <Pressable
            accessibilityRole="button"
            disabled={isRefreshing}
            onPress={() => {
              if (isRefreshing) {
                return;
              }

              void onRefreshLedger();
            }}
            style={({ pressed }) => [
              styles.errorRetry,
              pressed && !isRefreshing ? styles.errorRetryPressed : null,
              isRefreshing ? styles.errorRetryDisabled : null,
            ]}
          >
            <Text style={styles.error}>{errorMessage}</Text>
            <Text style={styles.errorRetryLabel}>재시도</Text>
          </Pressable>
        ) : null}
        {showsBannerAd ? (
          <View style={styles.adPanel}>
            <AppBannerAd variant="embedded" />
          </View>
        ) : null}
        <View style={styles.calendarAdSection}>
          <Text accessibilityRole="header" style={styles.monthTitle}>
            {formatMonthLabel(displayedCalendarMonth)}
          </Text>
          <WeekdayHeader />
          <MonthCalendarPager
            key={calendarFocusRevision}
            currentPage={state.currentMonthPage}
            isCalendarHeatmapEnabled={isCalendarHeatmapEnabled}
            isReadOnlyDueToPlanLimit={isReadOnlyDueToPlanLimit}
            nextPage={state.nextMonthPage}
            onMoveMonth={handleMoveMonth}
            onPreviewMonthOffsetChange={setPreviewMonthOffset}
            onSelectDate={onSelectCalendarDate}
            previousPage={state.previousMonthPage}
            selectedDate={selectedDate}
          />
        </View>
      </View>
      <View style={styles.transactionSection}>
        <View style={styles.transactionSummaryPanel}>
          <MonthlySummary
            balanceAmount={displayedSummary.balanceAmount}
            balanceLabel={displayedSummary.balanceLabel}
            summaryLabel={displayedSummary.summaryLabel}
            totalExpense={displayedSummary.totalExpense}
            totalIncome={displayedSummary.totalIncome}
          />
        </View>
        <HomeTransactionList
          activeBookId={state.activeBook?.id ?? null}
          entries={selectedEntries}
          isLoading={isLoadingSelectedDateEntries}
          isRefreshing={isRefreshing}
          onDeleteEntry={onDeleteSelectedEntry}
          onEditEntry={onEditSelectedEntry}
          onPrepayInstallmentEntry={onPrepayInstallmentEntry}
          onRefresh={onRefreshLedger}
        />
      </View>
    </View>
  );
}

function resolveDisplayedSummary(
  state: LedgerScreenState,
  calendarSummaryMode: CalendarSummaryMode,
): DisplayedSummary {
  if (calendarSummaryMode === CalendarSummaryModes.monthly) {
    return {
      balanceAmount: state.monthlyLedger.balance,
      summaryLabel: formatCalendarMonthlySummaryLabel(formatMonthLabel(state.visibleMonth)),
      totalExpense: formatCurrency(state.monthlyLedger.totalExpense),
      totalIncome: formatCurrency(state.monthlyLedger.totalIncome),
    };
  }

  if (
    calendarSummaryMode === CalendarSummaryModes.selectedMonth &&
    !state.selectedMonthSummaryDate
  ) {
    return {
      balanceAmount: 0,
      balanceLabel: CalendarSummaryLoadingLabel,
      summaryLabel: CalendarSummaryLabels.selectedMonthPrompt,
      totalExpense: CalendarSummaryLoadingLabel,
      totalIncome: CalendarSummaryLoadingLabel,
    };
  }

  const summaryLabel =
    calendarSummaryMode === CalendarSummaryModes.selectedMonth
      ? state.selectedMonthSummaryLabel ?? CalendarSummaryLabels.selectedMonthPrompt
      : CalendarSummaryLabels.all;

  if (!state.totalLedgerSummary) {
    return {
      balanceAmount: 0,
      balanceLabel: CalendarSummaryLoadingLabel,
      summaryLabel,
      totalExpense: CalendarSummaryLoadingLabel,
      totalIncome: CalendarSummaryLoadingLabel,
    };
  }

  return {
    balanceAmount: state.totalLedgerSummary.balance,
    summaryLabel,
    totalExpense: formatCurrency(state.totalLedgerSummary.totalExpense),
    totalIncome: formatCurrency(state.totalLedgerSummary.totalIncome),
  };
}

function moveMonth(
  visibleMonth: Date,
  monthOffset: number,
  onSelectDate: (isoDate: string) => void,
  todayIsoDate: string,
) {
  const targetDate = addMonths(visibleMonth, monthOffset);
  const todayDate = parseIsoDate(todayIsoDate);

  if (
    targetDate.getFullYear() === todayDate.getFullYear() &&
    targetDate.getMonth() === todayDate.getMonth()
  ) {
    onSelectDate(todayIsoDate);
    return;
  }

  onSelectDate(toIsoDate(startOfMonth(targetDate)));
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.screenBackground,
    paddingHorizontal: AppLayout.screenPadding,
  },
  screenContent: {
    flex: 1,
    paddingTop: AppLayout.screenTopPadding,
  },
  calendarAdSection: {
    gap: AppLayout.calendarGap,
  },
  monthTitle: {
    color: AppColors.text,
    fontSize: HomeScreenUi.monthTitleFontSize,
    fontWeight: "800",
    lineHeight: HomeScreenUi.monthTitleLineHeight,
    marginBottom: AppLayout.compactGap,
  },
  transactionSection: {
    ...FullBleedHorizontalStyle,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border,
    flex: 1,
    minHeight: HomeScreenUi.transactionMinimumHeight,
    paddingTop: AppLayout.compactGap,
  },
  adPanel: {
    ...FullBleedHorizontalStyle,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border,
    backgroundColor: AppColors.adBackground,
    marginBottom: AppLayout.compactGap,
  },
  transactionSummaryPanel: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border,
    paddingBottom: AppLayout.compactGap,
    paddingHorizontal: AppLayout.screenPadding,
  },
  error: {
    color: AppColors.expense,
    fontSize: 12,
  },
  errorRetry: {
    gap: 2,
    alignItems: "flex-start",
  },
  errorRetryPressed: {
    opacity: 0.7,
  },
  errorRetryDisabled: {
    opacity: 0.5,
  },
  errorRetryLabel: {
    color: AppColors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
});
