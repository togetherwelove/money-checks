import {
  type MonthPage,
  buildMonthPageFromSummary,
} from "../../components/monthCalendarPager/monthCalendarPagerUtils";
import { type CalendarSummaryMode, CalendarSummaryModes } from "../../constants/calendarSummary";
import type { LedgerEntry, MonthlyInsights, MonthlyLedgerSummary } from "../../types/ledger";
import {
  addMonths,
  buildMonthlyLedger,
  formatMonthYear,
  getMonthKey,
  parseIsoDate,
} from "../../utils/calendar";
import { buildSelectedMonthSummaryRangeForMonth } from "../../utils/calendarSummaryRange";
import {
  MONTHLY_TREND_MONTH_COUNT,
  buildMonthlyInsightsFromMonths,
  buildOverallInsights,
  buildPeriodInsights,
  getTrendMonths,
} from "../../utils/monthlyInsights";
import type { LedgerEntryCache } from "./ledgerEntryCache";
import { getMonthEntries } from "./ledgerEntryCache";
import type { ChartMonthData } from "./types";

const PAGE_WINDOW_MONTH_OFFSETS = [-1, 0, 1] as const;

export function getMonthlyLedgerFromCache(
  entryCache: LedgerEntryCache,
  targetMonth: Date,
): MonthlyLedgerSummary {
  const windowEntries = PAGE_WINDOW_MONTH_OFFSETS.flatMap((monthOffset) =>
    getMonthEntries(entryCache, addMonths(targetMonth, monthOffset)),
  );

  return buildMonthlyLedger(getMonthKey(targetMonth), windowEntries);
}

export function getMonthlyInsightsFromCache(
  entryCache: LedgerEntryCache,
  targetMonth: Date,
): MonthlyInsights {
  return buildMonthlyInsightsFromMonths(
    targetMonth,
    getMonthEntries(entryCache, targetMonth),
    getMonthEntries(entryCache, addMonths(targetMonth, -1)),
    getTrendMonths(targetMonth).map((month) => ({
      entries: getMonthEntries(entryCache, month),
      month,
    })),
  );
}

export function getMonthPageFromCache(entryCache: LedgerEntryCache, targetMonth: Date): MonthPage {
  const monthSummary = getMonthlyLedgerFromCache(entryCache, targetMonth);
  return buildMonthPageFromSummary(getMonthKey(targetMonth), monthSummary);
}

export function getChartMonthDataFromCache(
  entryCache: LedgerEntryCache,
  targetMonth: Date,
  options?: {
    allEntries?: LedgerEntry[];
    calendarSummaryBaseDay?: number | null;
    calendarSummaryMode?: CalendarSummaryMode;
  },
): ChartMonthData {
  if (options?.calendarSummaryMode === CalendarSummaryModes.all) {
    return {
      key: "all",
      monthlyInsights: buildOverallInsights(
        options.allEntries ?? getAllEntriesFromCache(entryCache),
      ),
      monthlyLedger: getMonthlyLedgerFromCache(entryCache, targetMonth),
      scope: "all",
      title: "전체 차트",
    };
  }

  if (
    options?.calendarSummaryMode === CalendarSummaryModes.selectedMonth &&
    options.calendarSummaryBaseDay
  ) {
    const currentRange = buildSelectedMonthSummaryRangeForMonth(
      targetMonth,
      options.calendarSummaryBaseDay,
    );
    return {
      key: getMonthKey(targetMonth),
      monthlyInsights: getPeriodInsightsFromCache(
        entryCache,
        targetMonth,
        options.calendarSummaryBaseDay,
      ),
      monthlyLedger: getMonthlyLedgerFromCache(entryCache, targetMonth),
      scope: "periodic",
      title: `${currentRange.label} 차트`,
    };
  }

  return {
    key: getMonthKey(targetMonth),
    monthlyInsights: getMonthlyInsightsFromCache(entryCache, targetMonth),
    monthlyLedger: getMonthlyLedgerFromCache(entryCache, targetMonth),
    scope: "periodic",
    title: `${formatMonthYear(targetMonth)} 차트`,
  };
}

function getPeriodInsightsFromCache(
  entryCache: LedgerEntryCache,
  targetMonth: Date,
  baseDay: number,
): MonthlyInsights {
  const currentRange = buildSelectedMonthSummaryRangeForMonth(targetMonth, baseDay);
  const previousRange = buildSelectedMonthSummaryRangeForMonth(addMonths(targetMonth, -1), baseDay);
  const allEntries = getAllEntriesFromCache(entryCache);

  return buildPeriodInsights({
    currentLabel: currentRange.label,
    currentPeriodEntries: filterEntriesByDateRange(
      allEntries,
      currentRange.startDate,
      currentRange.endDate,
    ),
    previousLabel: previousRange.label,
    previousPeriodEntries: filterEntriesByDateRange(
      allEntries,
      previousRange.startDate,
      previousRange.endDate,
    ),
    trendPeriods: Array.from({ length: MONTHLY_TREND_MONTH_COUNT }, (_, index) => {
      const month = addMonths(targetMonth, index - MONTHLY_TREND_MONTH_COUNT + 1);
      const range = buildSelectedMonthSummaryRangeForMonth(month, baseDay);
      return {
        entries: filterEntriesByDateRange(allEntries, range.startDate, range.endDate),
        label: formatCompactIsoDate(range.startDate),
        month: parseIsoDate(range.startDate),
      };
    }),
  });
}

function getAllEntriesFromCache(entryCache: LedgerEntryCache): LedgerEntry[] {
  return Object.values(entryCache).flat();
}

function filterEntriesByDateRange(
  entries: LedgerEntry[],
  dateFrom: string,
  dateTo: string,
): LedgerEntry[] {
  return entries.filter((entry) => entry.date >= dateFrom && entry.date <= dateTo);
}

function formatCompactIsoDate(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  return `${date.getMonth() + 1}.${date.getDate()}`;
}
