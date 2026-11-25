import type { AllEntriesDateRange } from "../constants/allEntries";
import type { CumulativeExpenseDay, DailyExpenseComparison } from "../types/expenseComparison";
import type { LedgerEntry } from "../types/ledger";
import { addDays, addMonths, parseIsoDate, startOfMonth, toIsoDate } from "./calendar";

export function buildCumulativeExpenses(
  entries: LedgerEntry[],
  range: AllEntriesDateRange,
): CumulativeExpenseDay[] {
  const dailyAmounts = new Map<string, number>();
  for (const entry of entries) {
    if (entry.type === "expense" && entry.date >= range.startDate && entry.date <= range.endDate) {
      dailyAmounts.set(entry.date, (dailyAmounts.get(entry.date) ?? 0) + entry.amount);
    }
  }

  const days: CumulativeExpenseDay[] = [];
  let amount = 0;
  for (
    let date = parseIsoDate(range.startDate);
    toIsoDate(date) <= range.endDate;
    date = addDays(date, 1)
  ) {
    const isoDate = toIsoDate(date);
    amount += dailyAmounts.get(isoDate) ?? 0;
    days.push({ date: isoDate, amount });
  }
  return days;
}

export function buildMonthlyExpenseComparison(
  month: Date,
  currentEntries: LedgerEntry[],
  previousEntries: LedgerEntry[],
): DailyExpenseComparison {
  const previousMonth = addMonths(month, -1);
  return {
    current: buildCumulativeExpenses(currentEntries, monthRange(month)),
    previous: buildCumulativeExpenses(previousEntries, monthRange(previousMonth)),
  };
}

function monthRange(month: Date): AllEntriesDateRange {
  return {
    startDate: toIsoDate(startOfMonth(month)),
    endDate: toIsoDate(addDays(addMonths(month, 1), -1)),
  };
}
