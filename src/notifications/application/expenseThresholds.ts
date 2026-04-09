import type { LedgerEntry } from "../../types/ledger";
import { addDays, parseIsoDate, startOfMonth, toIsoDate } from "../../utils/calendar";
import type { NotificationThresholdPeriod } from "../domain/notificationEvents";

export function shouldNotifyExpenseLimit(params: {
  currentEntries: LedgerEntry[];
  entryDate: string;
  nextEntries: LedgerEntry[];
  period: NotificationThresholdPeriod;
  thresholdAmount: number;
}): boolean {
  const { currentEntries, entryDate, nextEntries, period, thresholdAmount } = params;
  if (thresholdAmount <= 0) {
    return false;
  }

  return (
    getExpenseTotalForPeriod(currentEntries, entryDate, period) < thresholdAmount &&
    getExpenseTotalForPeriod(nextEntries, entryDate, period) >= thresholdAmount
  );
}

export function getExpenseTotalForPeriod(
  entries: LedgerEntry[],
  entryDate: string,
  period: NotificationThresholdPeriod,
): number {
  const { end, start } = getPeriodBounds(entryDate, period);
  return entries
    .filter((entry) => entry.type === "expense" && entry.date >= start && entry.date <= end)
    .reduce((sum, entry) => sum + entry.amount, 0);
}

function getPeriodBounds(entryDate: string, period: NotificationThresholdPeriod) {
  if (period === "day") {
    return { end: entryDate, start: entryDate };
  }

  const anchorDate = parseIsoDate(entryDate);
  if (period === "week") {
    const weekStart = addDays(anchorDate, -anchorDate.getDay());
    const weekEnd = addDays(weekStart, 6);
    return { end: toIsoDate(weekEnd), start: toIsoDate(weekStart) };
  }

  const monthStart = startOfMonth(anchorDate);
  const monthEnd = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0);
  return { end: toIsoDate(monthEnd), start: toIsoDate(monthStart) };
}
