import {
  type MonthPage,
  buildMonthPageFromSummary,
} from "../../components/monthCalendarPager/monthCalendarPagerUtils";
import type { MonthlyInsights, MonthlyLedgerSummary } from "../../types/ledger";
import { addMonths, buildMonthlyLedger, getMonthKey } from "../../utils/calendar";
import { formatMonthYear } from "../../utils/calendar";
import { buildMonthlyInsightsFromMonths } from "../../utils/monthlyInsights";
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
  );
}

export function getMonthPageFromCache(entryCache: LedgerEntryCache, targetMonth: Date): MonthPage {
  const monthSummary = getMonthlyLedgerFromCache(entryCache, targetMonth);
  return buildMonthPageFromSummary(getMonthKey(targetMonth), monthSummary);
}

export function getChartMonthDataFromCache(
  entryCache: LedgerEntryCache,
  targetMonth: Date,
): ChartMonthData {
  return {
    key: getMonthKey(targetMonth),
    monthlyInsights: getMonthlyInsightsFromCache(entryCache, targetMonth),
    monthlyLedger: getMonthlyLedgerFromCache(entryCache, targetMonth),
    title: formatMonthYear(targetMonth),
  };
}
