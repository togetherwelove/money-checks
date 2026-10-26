import { type ReactNode, useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppBannerAd } from "../components/AppBannerAd";
import { MonthCalendarPager } from "../components/MonthCalendarPager";
import { MonthlySummary } from "../components/MonthlySummary";
import { WeekdayHeader } from "../components/WeekdayHeader";
import { ScreenLoadingOverlay } from "../components/ScreenLoadingOverlay";
import { HomeAdaptiveLayout } from "../components/homeScreen/HomeAdaptiveLayout";
import { HomeTransactionList } from "../components/homeScreen/HomeTransactionList";
import type { MonthOffset } from "../components/monthCalendarPager/monthCalendarPagerTypes";
import {
  type CalendarSummaryMode,
  formatSelectedDateEntryCount,
} from "../constants/calendarSummary";
import { AppColors } from "../constants/colors";
import { MonthlySummaryUi } from "../constants/home";
import { AppLayout } from "../constants/layout";
import { formatMonthLabel, formatYearLabel } from "../constants/ledgerDisplay";
import { AppMessages } from "../constants/messages";
import type { LedgerScreenState } from "../hooks/useLedgerScreenState";
import type { LedgerEntry } from "../types/ledger";
import type { LedgerEntryDeleteHandler } from "../types/ledgerEntryDeletion";
import type { InstallmentPrepaymentHandler } from "../types/installmentTransactions";
import {
  addMonths,
  parseIsoDate,
  startOfMonth,
  toIsoDate,
} from "../utils/calendar";

import { formatSummarySelectedDate, resolveDisplayedSummary } from "../utils/homeSummary";

type HomeScreenProps = {
  calendarSummaryMode: CalendarSummaryMode;
  onDeleteSelectedEntry: LedgerEntryDeleteHandler;
  onDuplicateEntry: (entry: LedgerEntry) => void;
  onEditSelectedEntry: (entry: LedgerEntry) => void;
  onPrepayInstallmentEntry: InstallmentPrepaymentHandler;
  onSelectCalendarDate: (isoDate: string) => void;
  screenTitle: (label: string) => ReactNode;
  isCalendarHeatmapEnabled: boolean;
  showsBannerAd: boolean;
  state: LedgerScreenState;
};

export function HomeScreen({
  calendarSummaryMode,
  onDeleteSelectedEntry,
  onDuplicateEntry,
  onEditSelectedEntry,
  onPrepayInstallmentEntry,
  onSelectCalendarDate,
  screenTitle,
  isCalendarHeatmapEnabled,
  showsBannerAd,
  state,
}: HomeScreenProps) {
  const todayIsoDate = toIsoDate(new Date());
  const {
    errorMessage,
    isLoadingSelectedDateEntries,
    isRefreshing,
    refreshLedger: onRefreshLedger,
    isReadOnlyDueToPlanLimit,
    selectedDate,
    selectedEntries,
    visibleMonth,
  } = state;

  const displayedSummary = resolveDisplayedSummary(state, calendarSummaryMode);
  const handleMoveMonth = useCallback(
    (monthOffset: MonthOffset) => {
      moveMonth(visibleMonth, monthOffset, state.handleSelectDate, todayIsoDate);
    },
    [state.handleSelectDate, todayIsoDate, visibleMonth],
  );

  const bannerAd = useMemo(() => showsBannerAd ? <AppBannerAd /> : null, [showsBannerAd]);

  return (
    <View style={[styles.screen, styles.screenContent]}>
      <View style={styles.adPanel}>{bannerAd}</View>
      <HomeAdaptiveLayout
        calendar={<View>
        {screenTitle(`${formatYearLabel(visibleMonth)} ${formatMonthLabel(visibleMonth)}`)}
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
        <View style={styles.calendarAdSection}>
          <WeekdayHeader />
          <MonthCalendarPager
            currentPage={state.currentMonthPage}
            isCalendarHeatmapEnabled={isCalendarHeatmapEnabled}
            isReadOnlyDueToPlanLimit={isReadOnlyDueToPlanLimit}
            nextPage={state.nextMonthPage}
            onMoveMonth={handleMoveMonth}
            onSelectDate={onSelectCalendarDate}
            previousPage={state.previousMonthPage}
            selectedDate={selectedDate}
          />
        </View>
      </View>}
        transactionHeader={<View style={styles.transactionSection}>
        <View style={styles.transactionSummaryPanel}>
          <MonthlySummary
            balanceAmount={displayedSummary.balanceAmount}
            balanceLabel={displayedSummary.balanceLabel}
            summaryLabel={displayedSummary.summaryLabel}
            totalExpense={displayedSummary.totalExpense}
            totalIncome={displayedSummary.totalIncome}
          />
        </View>
        <View style={styles.selectedDateHeader}>
          <Text accessibilityRole="header" style={styles.selectedDateLabel}>
            {formatSummarySelectedDate(selectedDate)}
          </Text>
          {!errorMessage ? (
            <Text style={styles.selectedDateCount}>
              {formatSelectedDateEntryCount(
                isLoadingSelectedDateEntries || state.isLoading ? null : selectedEntries.length,
              )}
            </Text>
          ) : null}
        </View>
      </View>}
        renderTransactions={() => (<HomeTransactionList
          activeBookId={state.activeBook?.id ?? null}
          entries={selectedEntries}
          isLoading={isLoadingSelectedDateEntries}
          isRefreshing={isRefreshing}
          onDeleteEntry={onDeleteSelectedEntry}
          onDuplicateEntry={onDuplicateEntry}
          onEditEntry={onEditSelectedEntry}
          onPrepayInstallmentEntry={onPrepayInstallmentEntry}
          onRefresh={onRefreshLedger}
        />)}
      />
      {state.isLoading ? <ScreenLoadingOverlay /> : null}
    </View>
  );
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
  },
  screenContent: {
    flex: 1,
    paddingTop: AppLayout.compactGap,
  },
  calendarAdSection: {
    gap: AppLayout.calendarGap,
  },
  transactionSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border,
  },
  adPanel: { flexShrink: 0 },
  selectedDateHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: AppLayout.cardContentPadding, paddingVertical: AppLayout.cardGap, gap: AppLayout.compactGap },
  selectedDateLabel: { flexShrink: 1, color: AppColors.text, fontSize: MonthlySummaryUi.dateLabelFontSize, fontWeight: "700" },
  selectedDateCount: { color: AppColors.mutedText, fontSize: MonthlySummaryUi.dateLabelFontSize },
  transactionSummaryPanel: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border,
    paddingVertical: AppLayout.compactGap,
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
