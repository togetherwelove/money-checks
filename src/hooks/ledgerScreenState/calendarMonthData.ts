import {
  type MonthPage,
  buildMonthPageFromSummary,
} from "../../components/monthCalendarPager/monthCalendarPagerUtils";
import type { LedgerDayNote, MonthlyInsights, MonthlyLedgerSummary } from "../../types/ledger";
import { addMonths, buildMonthlyLedger, getMonthKey } from "../../utils/calendar";
import { formatMonthYear } from "../../utils/calendar";
import { buildMonthlyInsightsFromMonths, getTrendMonths } from "../../utils/monthlyInsights";
import type { LedgerEntryCache } from "./ledgerEntryCache";
import { getMonthEntries } from "./ledgerEntryCache";
import type { ChartMonthData } from "./types";

const PAGE_WINDOW_MONTH_OFFSETS = [-1, 0, 1] as const;

export function getMonthlyLedgerFromCache(
  dateNoteByDate: Map<string, LedgerDayNote>,
  entryCache: LedgerEntryCache,
  targetMonth: Date,
): MonthlyLedgerSummary {
  const windowEntries = PAGE_WINDOW_MONTH_OFFSETS.flatMap((monthOffset) =>
    getMonthEntries(entryCache, addMonths(targetMonth, monthOffset)),
  );

  return buildMonthlyLedger(getMonthKey(targetMonth), windowEntries, dateNoteByDate);
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

export function getMonthPageFromCache(
  dateNoteByDate: Map<string, LedgerDayNote>,
  entryCache: LedgerEntryCache,
  targetMonth: Date,
): MonthPage {
  const monthSummary = getMonthlyLedgerFromCache(dateNoteByDate, entryCache, targetMonth);
  return buildMonthPageFromSummary(getMonthKey(targetMonth), monthSummary);
}

export function getChartMonthDataFromCache(
  dateNoteByDate: Map<string, LedgerDayNote>,
  entryCache: LedgerEntryCache,
  targetMonth: Date,
): ChartMonthData {
  return {
    key: getMonthKey(targetMonth),
    monthlyInsights: getMonthlyInsightsFromCache(entryCache, targetMonth),
    monthlyLedger: getMonthlyLedgerFromCache(dateNoteByDate, entryCache, targetMonth),
    title: formatMonthYear(targetMonth),
  };
}
