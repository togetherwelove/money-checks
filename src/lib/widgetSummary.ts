import { KRW_CURRENCY_SUFFIX } from "../constants/ledgerDisplay";
import { LedgerWidgetConfig } from "../constants/widget";
import type { LedgerEntry } from "../types/ledger";
import type { LedgerWidgetSummary } from "../types/widget";
import { formatAmountNumber } from "../utils/amount";
import { formatEntryMetaDate } from "../utils/calendar";

const EMPTY_AMOUNT_LABEL = `0${KRW_CURRENCY_SUFFIX}`;

export function buildLedgerWidgetSummary(
  entries: LedgerEntry[],
  todayIsoDate: string,
): LedgerWidgetSummary {
  const monthKey = todayIsoDate.slice(0, "yyyy-MM".length);
  const todayEntries = entries.filter((entry) => entry.date === todayIsoDate);
  const monthEntries = entries.filter((entry) => entry.date.startsWith(`${monthKey}-`));
  const monthIncomeAmount = sumEntries(monthEntries, "income");
  const monthExpenseAmount = sumEntries(monthEntries, "expense");

  return {
    todayIncomeLabel: formatWidgetAmount(sumEntries(todayEntries, "income")),
    todayExpenseLabel: formatWidgetAmount(sumEntries(todayEntries, "expense")),
    monthIncomeAmount,
    monthIncomeLabel: formatWidgetAmount(monthIncomeAmount),
    monthExpenseAmount,
    monthExpenseLabel: formatWidgetAmount(monthExpenseAmount),
    recentEntries: [...monthEntries]
      .sort(compareLedgerEntriesByRecentDate)
      .slice(0, LedgerWidgetConfig.maxRecentEntries)
      .map((entry) => ({
        amountLabel: formatWidgetAmount(entry.amount),
        dateLabel: formatEntryMetaDate(entry.date),
        title: entry.content,
        type: entry.type,
      })),
  };
}

function sumEntries(entries: LedgerEntry[], type: LedgerEntry["type"]): number {
  return entries
    .filter((entry) => entry.type === type)
    .reduce((totalAmount, entry) => totalAmount + entry.amount, 0);
}

function formatWidgetAmount(amount: number): string {
  if (amount === 0) {
    return EMPTY_AMOUNT_LABEL;
  }

  return `${formatAmountNumber(amount)}${KRW_CURRENCY_SUFFIX}`;
}

function compareLedgerEntriesByRecentDate(left: LedgerEntry, right: LedgerEntry): number {
  if (left.date !== right.date) {
    return right.date.localeCompare(left.date);
  }

  return right.id.localeCompare(left.id);
}
