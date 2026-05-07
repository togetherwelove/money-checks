import {
  DEFAULT_MEMBER_DISPLAY_NAME,
  EMPTY_CATEGORY_LABEL,
  formatCompactMonthLabel,
  formatMonthLabel,
} from "../constants/ledgerDisplay";
import type {
  LedgerEntry,
  MonthlyCategoryExpense,
  MonthlyChangeDirection,
  MonthlyComparisonMetric,
  MonthlyInsights,
  MonthlyMemberExpense,
  MonthlyTrendPoint,
} from "../types/ledger";
import { addMonths } from "./calendar";

export const MONTHLY_TREND_MONTH_COUNT = 6;

type MonthlyTrendInput = {
  entries: LedgerEntry[];
  month: Date;
};

export function buildMonthlyInsights(monthKey: string, entries: LedgerEntry[]): MonthlyInsights {
  const currentMonthDate = parseMonthKey(monthKey);
  const previousMonthDate = addMonths(currentMonthDate, -1);
  const currentMonthEntries = filterEntriesByMonth(entries, monthKey);
  const previousMonthEntries = filterEntriesByMonth(entries, toMonthKey(previousMonthDate));
  const trendMonths = buildTrendInputsFromEntryList(currentMonthDate, entries);

  return buildMonthlyInsightsFromMonths(
    currentMonthDate,
    currentMonthEntries,
    previousMonthEntries,
    trendMonths,
  );
}

export function buildMonthlyInsightsFromMonths(
  currentMonthDate: Date,
  currentMonthEntries: LedgerEntry[],
  previousMonthEntries: LedgerEntry[],
  trendMonths = buildDefaultTrendInputs(
    currentMonthDate,
    currentMonthEntries,
    previousMonthEntries,
  ),
): MonthlyInsights {
  const previousMonthDate = addMonths(currentMonthDate, -1);

  return {
    categoryExpenses: buildCategoryExpenses(currentMonthEntries),
    currentMonthLabel: formatMonthLabel(currentMonthDate),
    expenseComparison: buildComparisonMetric(currentMonthEntries, previousMonthEntries, "expense"),
    incomeComparison: buildComparisonMetric(currentMonthEntries, previousMonthEntries, "income"),
    previousMonthLabel: formatMonthLabel(previousMonthDate),
    memberExpenses: buildMemberExpenses(currentMonthEntries),
    trendMonths: buildTrendMonths(currentMonthDate, trendMonths),
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

function buildMemberExpenses(entries: LedgerEntry[]): MonthlyMemberExpense[] {
  const expenseEntries = entries.filter((entry) => entry.type === "expense");
  const totalExpense = expenseEntries.reduce((sum, entry) => sum + entry.amount, 0);
  if (!totalExpense) {
    return [];
  }

  const amountByMember = new Map<string, number>();
  for (const entry of expenseEntries) {
    const memberName =
      entry.targetMemberName?.trim() || entry.authorName?.trim() || DEFAULT_MEMBER_DISPLAY_NAME;
    amountByMember.set(memberName, (amountByMember.get(memberName) ?? 0) + entry.amount);
  }

  return [...amountByMember.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([memberName, amount]) => ({
      amount,
      memberName,
      share: amount / totalExpense,
    }));
}

function buildTrendMonths(
  currentMonthDate: Date,
  trendInputs: MonthlyTrendInput[],
): MonthlyTrendPoint[] {
  return trendInputs.map(({ entries, month }) => ({
    expenseAmount: sumEntriesByType(entries, "expense"),
    incomeAmount: sumEntriesByType(entries, "income"),
    isCurrentMonth: toMonthKey(month) === toMonthKey(currentMonthDate),
    key: toMonthKey(month),
    monthLabel: formatCompactMonthLabel(month),
  }));
}

function sumEntriesByType(entries: LedgerEntry[], type: "expense" | "income"): number {
  return entries
    .filter((entry) => entry.type === type)
    .reduce((sum, entry) => sum + entry.amount, 0);
}

function buildTrendInputsFromEntryList(
  currentMonthDate: Date,
  entries: LedgerEntry[],
): MonthlyTrendInput[] {
  return getTrendMonths(currentMonthDate).map((month) => ({
    entries: filterEntriesByMonth(entries, toMonthKey(month)),
    month,
  }));
}

function buildDefaultTrendInputs(
  currentMonthDate: Date,
  currentMonthEntries: LedgerEntry[],
  previousMonthEntries: LedgerEntry[],
): MonthlyTrendInput[] {
  return getTrendMonths(currentMonthDate).map((month) => {
    const monthKey = toMonthKey(month);
    if (monthKey === toMonthKey(currentMonthDate)) {
      return { entries: currentMonthEntries, month };
    }

    if (monthKey === toMonthKey(addMonths(currentMonthDate, -1))) {
      return { entries: previousMonthEntries, month };
    }

    return { entries: [], month };
  });
}

export function getTrendMonths(currentMonthDate: Date): Date[] {
  return Array.from({ length: MONTHLY_TREND_MONTH_COUNT }, (_, index) =>
    addMonths(currentMonthDate, index - MONTHLY_TREND_MONTH_COUNT + 1),
  );
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
