import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { buildMonthPageFromSummary } from "../components/monthCalendarPager/monthCalendarPagerUtils";
import { AppTextScale, resolveTextScale } from "../constants/textLayout";
import type { HomeScreenState } from "../screens/HomeScreen";
import type { LedgerEntry } from "../types/ledger";
import { addMonths, buildMonthlyLedger, getMonthKey, parseIsoDate } from "../utils/calendar";

const emptyEntries: LedgerEntry[] = [];
const refreshLedger = async () => {};
const monthOffsets = [-1, 0, 1] as const;

export function useGuestHomeState(
  selectedDate: string,
  onSelectDate: (date: string) => void,
): HomeScreenState {
  const { fontScale } = useWindowDimensions();
  const monthKey = getMonthKey(parseIsoDate(selectedDate));
  const visibleMonth = useMemo(() => parseIsoDate(`${monthKey}-01`), [monthKey]);
  const pages = useMemo(
    () =>
      monthOffsets.map((offset) => {
        const month = addMonths(visibleMonth, offset);
        return buildMonthPageFromSummary(
          getMonthKey(month),
          buildMonthlyLedger(getMonthKey(month), emptyEntries),
          resolveTextScale(fontScale, AppTextScale.compact),
        );
      }),
    [visibleMonth, fontScale],
  );
  return {
    activeBook: null,
    currentMonthPage: pages[1],
    previousMonthPage: pages[0],
    nextMonthPage: pages[2],
    monthlyLedger: pages[1].summary,
    totalLedgerSummary: null,
    selectedMonthSummaryLabel: null,
    selectedMonthSummaryDate: null,
    selectedDate,
    selectedEntries: emptyEntries,
    visibleMonth,
    handleSelectDate: onSelectDate,
    refreshLedger,
    errorMessage: null,
    isLoading: false,
    isLoadingSelectedDateEntries: false,
    isLoadingTotalSummary: false,
    isRefreshing: false,
    isReadOnlyDueToPlanLimit: false,
  };
}
