import { AppFontSize } from "../constants/typography";
import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
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
import { getAppColors } from "../constants/colors";
import { MonthlySummaryUi } from "../constants/home";
import { AppLayout } from "../constants/layout";
import { BannerAdLayout } from "../constants/ads";
import { formatMonthLabel, formatYearLabel } from "../constants/ledgerDisplay";
import type { LedgerScreenState } from "../hooks/useLedgerScreenState";
import type { LedgerEntry } from "../types/ledger";
import type { LedgerEntryDeleteHandler } from "../types/ledgerEntryDeletion";
import type { InstallmentPrepaymentHandler } from "../types/installmentTransactions";
import { addMonths, parseIsoDate, startOfMonth, toIsoDate } from "../utils/calendar";

import {
  formatSummarySelectedDate,
  resolveDisplayedSummary,
  type HomeSummaryState,
} from "../utils/homeSummary";

export type HomeScreenState = HomeSummaryState &
  Pick<
    LedgerScreenState,
    | "errorMessage"
    | "isLoadingSelectedDateEntries"
    | "isRefreshing"
    | "refreshLedger"
    | "isReadOnlyDueToPlanLimit"
    | "selectedDate"
    | "selectedEntries"
    | "visibleMonth"
    | "handleSelectDate"
    | "currentMonthPage"
    | "nextMonthPage"
    | "previousMonthPage"
    | "activeBook"
  >;

type HomeScreenProps = {
  calendarSummaryMode: CalendarSummaryMode;
  onDeleteSelectedEntry: LedgerEntryDeleteHandler;
  onAddFrequentEntry?: (entry: LedgerEntry) => void;
  onDuplicateEntry: (entry: LedgerEntry) => void;
  onEditSelectedEntry: (entry: LedgerEntry) => void;
  calendarSummaryBaseDay?: number | null;
  onSelectSummaryMode?: (mode: CalendarSummaryMode, day?: number) => void;
  onPrepayInstallmentEntry: InstallmentPrepaymentHandler;
  onSelectCalendarDate: (isoDate: string) => void;
  screenTitle: (label: string) => ReactNode;
  isCalendarHeatmapEnabled: boolean;
  showsBannerAd: boolean;
  reservesBannerAdSpace?: boolean;
  state: HomeScreenState;
  entryAppend?: ReactNode;
};

export function HomeScreen({
  calendarSummaryMode,
  onDeleteSelectedEntry,
  onAddFrequentEntry,
  onDuplicateEntry,
  onEditSelectedEntry,
  calendarSummaryBaseDay,
  onSelectSummaryMode,
  onPrepayInstallmentEntry,
  onSelectCalendarDate,
  screenTitle,
  isCalendarHeatmapEnabled,
  showsBannerAd,
  reservesBannerAdSpace = showsBannerAd,
  state,
  entryAppend,
}: HomeScreenProps) {
  const styles = getStyles();
  useAppTheme();
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

  const bannerAd = useMemo(() => (showsBannerAd ? <AppBannerAd /> : null), [showsBannerAd]);

  return (
    <View style={[styles.screen, styles.screenContent]}>
      <View style={[styles.adPanel, reservesBannerAdSpace && styles.reservedAdPanel]}>
        {bannerAd}
      </View>
      <HomeAdaptiveLayout
        calendar={
          <View>
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
                onMoveWeekDate={state.handleSelectDate}
                onSelectDate={onSelectCalendarDate}
                previousPage={state.previousMonthPage}
                selectedDate={selectedDate}
              />
            </View>
          </View>
        }
        transactionHeader={
          <View>
            <View style={styles.transactionSummaryPanel}>
              <MonthlySummary
                balanceAmount={displayedSummary.balanceAmount}
                balanceLabel={displayedSummary.balanceLabel}
                calendarSummaryMode={calendarSummaryMode}
                calendarSummaryBaseDay={calendarSummaryBaseDay}
                onSelectSummaryMode={onSelectSummaryMode}
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
                  {formatSelectedDateEntryCount(selectedEntries.length)}
                </Text>
              ) : null}
            </View>
          </View>
        }
        renderTransactions={() => (
          <HomeTransactionList
            activeBookId={state.activeBook?.id ?? null}
            entries={selectedEntries}
            isLoading={isLoadingSelectedDateEntries}
            onRefresh={onRefreshLedger}
            selectedDate={selectedDate}
            onDeleteEntry={onDeleteSelectedEntry}
            onAddFrequentEntry={onAddFrequentEntry}
            onDuplicateEntry={onDuplicateEntry}
            onEditEntry={onEditSelectedEntry}
            onPrepayInstallmentEntry={onPrepayInstallmentEntry}
            entryAppend={entryAppend}
          />
        )}
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

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: getAppColors().screenBackground,
    },
    screenContent: {
      flex: 1,
      paddingTop: AppLayout.compactGap,
    },
    calendarAdSection: {
      gap: AppLayout.calendarGap,
    },
    adPanel: { flexShrink: 0 },
    reservedAdPanel: { height: BannerAdLayout.height + StyleSheet.hairlineWidth },
    selectedDateHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: AppLayout.cardContentPadding,
      paddingVertical: AppLayout.cardGap,
      gap: AppLayout.compactGap,
    },
    selectedDateLabel: {
      flexShrink: 1,
      color: getAppColors().text,
      fontSize: MonthlySummaryUi.dateLabelFontSize,
      fontWeight: "700",
    },
    selectedDateCount: {
      color: getAppColors().mutedText,
      fontSize: MonthlySummaryUi.dateLabelFontSize,
    },
    transactionSummaryPanel: {
      paddingBottom: AppLayout.compactGap,
      paddingHorizontal: AppLayout.screenPadding,
    },
    error: {
      color: getAppColors().expense,
      fontSize: AppFontSize.caption,
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
      color: getAppColors().primary,
      fontSize: AppFontSize.caption,
      fontWeight: "700",
    },
  }),
);
