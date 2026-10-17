import {
  type CalendarSummaryMode,
  CalendarSummaryLabels,
  CalendarSummaryLoadingLabel,
  CalendarSummaryModes,
} from "../constants/calendarSummary";
import type { LedgerScreenState } from "../hooks/useLedgerScreenState";
import { formatCurrency, parseIsoDate } from "./calendar";

const selectedDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "long", day: "numeric", weekday: "short",
});

export function formatSummarySelectedDate(isoDate: string): string {
  return selectedDateFormatter.format(parseIsoDate(isoDate));
}

export function resolveDisplayedSummary(state: LedgerScreenState, mode: CalendarSummaryMode) {
  const isMonthly = mode === CalendarSummaryModes.monthly;
  const summaryLabel = isMonthly
    ? CalendarSummaryLabels.monthly
    : mode === CalendarSummaryModes.all
      ? CalendarSummaryLabels.all
      : state.selectedMonthSummaryLabel ?? CalendarSummaryLabels.selectedMonthPrompt;
  const summary = isMonthly ? state.monthlyLedger : state.totalLedgerSummary;
  const isLoading = isMonthly ? state.isLoading : state.isLoadingTotalSummary;
  if (!summary || isLoading || (mode === CalendarSummaryModes.selectedMonth && !state.selectedMonthSummaryDate)) {
    return {
      summaryLabel, balanceAmount: 0, balanceLabel: CalendarSummaryLoadingLabel,
      totalExpense: CalendarSummaryLoadingLabel, totalIncome: CalendarSummaryLoadingLabel,
    };
  }
  return {
    summaryLabel, balanceAmount: summary.balance, balanceLabel: undefined,
    totalExpense: formatCurrency(summary.totalExpense),
    totalIncome: formatCurrency(summary.totalIncome),
  };
}
