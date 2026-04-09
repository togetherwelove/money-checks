import { EMPTY_CATEGORY_LABEL, formatMonthLabel } from "../constants/ledgerDisplay";
import type {
  LedgerEntry,
  MonthlyCategoryExpense,
  MonthlyChangeDirection,
  MonthlyComparisonMetric,
  MonthlyInsights,
} from "../types/ledger";
import { addMonths } from "./calendar";

export function buildMonthlyInsights(monthKey: string, entries: LedgerEntry[]): MonthlyInsights {
  const currentMonthDate = parseMonthKey(monthKey);
  const previousMonthDate = addMonths(currentMonthDate, -1);
  const currentMonthEntries = filterEntriesByMonth(entries, monthKey);
  const previousMonthEntries = filterEntriesByMonth(entries, toMonthKey(previousMonthDate));

  return buildMonthlyInsightsFromMonths(
    currentMonthDate,
    currentMonthEntries,
    previousMonthEntries,
  );
}

export function buildMonthlyInsightsFromMonths(
  currentMonthDate: Date,
  currentMonthEntries: LedgerEntry[],
  previousMonthEntries: LedgerEntry[],
): MonthlyInsights {
  const previousMonthDate = addMonths(currentMonthDate, -1);

  return {
    categoryExpenses: buildCategoryExpenses(currentMonthEntries),
    currentMonthLabel: formatMonthLabel(currentMonthDate),
    expenseComparison: buildComparisonMetric(currentMonthEntries, previousMonthEntries, "expense"),
    incomeComparison: buildComparisonMetric(currentMonthEntries, previousMonthEntries, "income"),
    previousMonthLabel: formatMonthLabel(previousMonthDate),
  };
}

function buildComparisonMetric(
  currentEntries: LedgerEntry[],
  previousEntries: LedgerEntry[],
  type: "expense" | "income",
): MonthlyComparisonMetric {
  const currentAmount = sumEntriesByType(currentEntries, type);
  const previousAmount = sumEntriesByType(previousEntries, type);
  const deltaAmount = currentAmount - previousAmount;

  return {
    currentAmount,
    deltaAmount: Math.abs(deltaAmount),
    direction: resolveDirection(deltaAmount),
    previousAmount,
  };
}

function buildCategoryExpenses(entries: LedgerEntry[]): MonthlyCategoryExpense[] {
  const expenseEntries = entries.filter((entry) => entry.type === "expense");
  const totalExpense = expenseEntries.reduce((sum, entry) => sum + entry.amount, 0);
  if (!totalExpense) {
    return [];
  }

  const amountByCategory = new Map<string, number>();
  for (const entry of expenseEntries) {
    const categoryLabel = entry.category.trim() || EMPTY_CATEGORY_LABEL;
    amountByCategory.set(categoryLabel, (amountByCategory.get(categoryLabel) ?? 0) + entry.amount);
  }

  return [...amountByCategory.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([category, amount]) => ({
      amount,
      category,
      share: amount / totalExpense,
    }));
}

function sumEntriesByType(entries: LedgerEntry[], type: "expense" | "income"): number {
  return entries
    .filter((entry) => entry.type === type)
    .reduce((sum, entry) => sum + entry.amount, 0);
}

function resolveDirection(deltaAmount: number): MonthlyChangeDirection {
  if (deltaAmount > 0) {
    return "increase";
  }

  if (deltaAmount < 0) {
    return "decrease";
  }

  return "same";
}

function filterEntriesByMonth(entries: LedgerEntry[], monthKey: string): LedgerEntry[] {
  return entries.filter((entry) => entry.date.startsWith(`${monthKey}-`));
}

function parseMonthKey(monthKey: string): Date {
  const [yearText, monthText] = monthKey.split("-");
  return new Date(Number(yearText), Number(monthText) - 1, 1);
}

function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
