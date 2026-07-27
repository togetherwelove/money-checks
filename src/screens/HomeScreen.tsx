import { useIsFocused } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppBannerAd } from "../components/AppBannerAd";
import { LedgerEntryList } from "../components/LedgerEntryList";
import { MonthCalendarPager } from "../components/MonthCalendarPager";
import { MonthlySummary } from "../components/MonthlySummary";
import { WeekdayHeader } from "../components/WeekdayHeader";
import {
  type CalendarSummaryMode,
  CalendarSummaryLabels,
  CalendarSummaryLoadingLabel,
  CalendarSummaryModes,
} from "../constants/calendarSummary";
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { AppMessages } from "../constants/messages";
import {
  FullBleedHorizontalStyle,
  FullBleedPaddedHorizontalStyle,
} from "../constants/uiStyles";
import type { LedgerScreenState } from "../hooks/useLedgerScreenState";
import type { LedgerEntry } from "../types/ledger";
import {
  addMonths,
  formatCurrency,
  parseIsoDate,
  startOfMonth,
  toIsoDate,
} from "../utils/calendar";

type HomeScreenProps = {
  calendarSummaryMode: CalendarSummaryMode;
  onDeleteSelectedEntry: (entry: LedgerEntry) => Promise<boolean>;
  onEditSelectedEntry: (entry: LedgerEntry) => void;
  onSelectCalendarDate: (isoDate: string) => void;
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
  onSelectCalendarDate,
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
        onRefreshLedger={refreshLedger}
        onSelectCalendarDate={onSelectCalendarDate}
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
  onRefreshLedger,
  onSelectCalendarDate,
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
  onDeleteSelectedEntry: (entry: LedgerEntry) => Promise<boolean>;
  onEditSelectedEntry: (entry: LedgerEntry) => void;
  onRefreshLedger: () => Promise<void>;
  onSelectCalendarDate: (isoDate: string) => void;
  selectedDate: string;
  selectedEntries: LedgerEntry[];
  showsBannerAd: boolean;
  state: LedgerScreenState;
  todayIsoDate: string;
  visibleMonth: Date;
}) {
  const displayedSummary = resolveDisplayedSummary(state, calendarSummaryMode);

  return (
    <View style={styles.screenContent}>
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
        <View style={styles.summaryPanel}>
          <MonthlySummary
            balanceAmount={displayedSummary.balanceAmount}
            balanceLabel={displayedSummary.balanceLabel}
            summaryLabel={displayedSummary.summaryLabel}
            totalExpense={displayedSummary.totalExpense}
            totalIncome={displayedSummary.totalIncome}
            variant="embedded"
          />
        </View>
        <WeekdayHeader />
        <MonthCalendarPager
          key={calendarFocusRevision}
          currentPage={state.currentMonthPage}
          isCalendarHeatmapEnabled={isCalendarHeatmapEnabled}
          isReadOnlyDueToPlanLimit={isReadOnlyDueToPlanLimit}
          nextPage={state.nextMonthPage}
          onMoveMonth={(monthOffset) =>
            moveMonth(visibleMonth, monthOffset, state.handleSelectDate, todayIsoDate)
          }
          onSelectDate={onSelectCalendarDate}
          previousPage={state.previousMonthPage}
          selectedDate={selectedDate}
        />
      </View>
      <View style={styles.transactionSection}>
        <ScrollView
          alwaysBounceVertical
          contentContainerStyle={styles.transactionScrollContent}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          refreshControl={
            <RefreshControl
              onRefresh={() => {
                void onRefreshLedger();
              }}
              refreshing={isRefreshing}
              tintColor={AppColors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          style={styles.transactionScroll}
        >
          {isLoadingSelectedDateEntries && selectedEntries.length === 0 ? (
            <ActivityIndicatorContainer />
          ) : (
            <>
              <LedgerEntryList
                activeBookId={state.activeBook?.id ?? null}
                entries={selectedEntries}
                onDeleteEntry={(entry) => {
                  Alert.alert(
                    AppMessages.editorDeleteConfirmTitle,
                    AppMessages.editorDeleteConfirmMessage,
                    [
                      {
                        style: "cancel",
                        text: "취소",
                      },
                      {
                        onPress: () => {
                          void onDeleteSelectedEntry(entry);
                        },
                        style: "destructive",
                        text: AppMessages.editorDeleteConfirmAction,
                      },
                    ],
                  );
                }}
                onEditEntry={onEditSelectedEntry}
              />
            </>
          )}
        </ScrollView>
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
      summaryLabel: CalendarSummaryLabels.monthly,
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

function ActivityIndicatorContainer() {
  return (
    <ActivityIndicator color={AppColors.primary} size="small" style={styles.selectedDateLoading} />
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
    paddingHorizontal: AppLayout.screenPadding,
  },
  screenContent: {
    flex: 1,
  },
  calendarAdSection: {
    gap: AppLayout.calendarGap,
  },
  transactionSection: {
    ...FullBleedHorizontalStyle,
    flex: 1,
    minHeight: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border,
    paddingTop: AppLayout.compactGap,
  },
  transactionScroll: {
    flex: 1,
    minHeight: 0,
  },
  transactionScrollContent: {
    flexGrow: 1,
    gap: AppLayout.compactGap,
  },
  adPanel: {
    ...FullBleedHorizontalStyle,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border,
    backgroundColor: AppColors.adBackground,
    marginBottom: AppLayout.compactGap,
  },
  summaryPanel: {
    ...FullBleedPaddedHorizontalStyle,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border,
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
  selectedDateLoading: {
    minHeight: 160,
  },
});
