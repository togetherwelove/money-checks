import {
  DEFAULT_MEMBER_DISPLAY_NAME,
  EMPTY_CATEGORY_LABEL,
  formatCompactMonthLabel,
  formatMonthLabel,
} from "../constants/ledgerDisplay";
import type {
  LedgerEntry,
  MonthlyCategoryExpense,
  MonthlyCategoryIncome,
  MonthlyChangeDirection,
  MonthlyComparisonMetric,
  MonthlyInsights,
  MonthlyMemberExpense,
  MonthlyMemberIncome,
  MonthlyTrendPoint,
} from "../types/ledger";
import { addMonths } from "./calendar";

export const MONTHLY_TREND_MONTH_COUNT = 6;

type MonthlyTrendInput = {
  entries: LedgerEntry[];
  label?: string;
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
    comparisonBasis: "month",
    categoryExpenses: buildCategoryExpenses(currentMonthEntries),
    categoryIncomes: buildCategoryIncomes(currentMonthEntries),
    currentMonthLabel: formatMonthLabel(currentMonthDate),
    expenseComparison: buildComparisonMetric(currentMonthEntries, previousMonthEntries, "expense"),
    incomeComparison: buildComparisonMetric(currentMonthEntries, previousMonthEntries, "income"),
    previousMonthLabel: formatMonthLabel(previousMonthDate),
    memberExpenses: buildMemberExpenses(currentMonthEntries),
    memberIncomes: buildMemberIncomes(currentMonthEntries),
    trendMonths: buildTrendMonths(currentMonthDate, trendMonths),
  };
}

export function buildPeriodInsights({
  currentLabel,
  currentPeriodEntries,
  previousLabel,
  previousPeriodEntries,
  trendPeriods,
}: {
  currentLabel: string;
  currentPeriodEntries: LedgerEntry[];
  previousLabel: string;
  previousPeriodEntries: LedgerEntry[];
  trendPeriods: MonthlyTrendInput[];
}): MonthlyInsights {
  return {
    comparisonBasis: "period",
    categoryExpenses: buildCategoryExpenses(currentPeriodEntries),
    categoryIncomes: buildCategoryIncomes(currentPeriodEntries),
    currentMonthLabel: currentLabel,
    expenseComparison: buildComparisonMetric(
      currentPeriodEntries,
      previousPeriodEntries,
      "expense",
    ),
    incomeComparison: buildComparisonMetric(currentPeriodEntries, previousPeriodEntries, "income"),
    previousMonthLabel: previousLabel,
    memberExpenses: buildMemberExpenses(currentPeriodEntries),
    memberIncomes: buildMemberIncomes(currentPeriodEntries),
    trendMonths: buildTrendMonthsFromInputs(trendPeriods),
  };
}

export function buildOverallInsights(entries: LedgerEntry[]): MonthlyInsights {
  return {
    comparisonBasis: "period",
    categoryExpenses: buildCategoryExpenses(entries),
    categoryIncomes: buildCategoryIncomes(entries),
    currentMonthLabel: "",
    expenseComparison: buildComparisonMetric(entries, [], "expense"),
    incomeComparison: buildComparisonMetric(entries, [], "income"),
    previousMonthLabel: "",
    memberExpenses: buildMemberExpenses(entries),
    memberIncomes: buildMemberIncomes(entries),
    trendMonths: [],
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
  return buildCategoryBreakdown(entries, "expense");
}

function buildCategoryIncomes(entries: LedgerEntry[]): MonthlyCategoryIncome[] {
  return buildCategoryBreakdown(entries, "income");
}

function buildCategoryBreakdown(
  entries: LedgerEntry[],
  type: "expense" | "income",
): MonthlyCategoryExpense[] {
  const typedEntries = entries.filter((entry) => entry.type === type);
  const totalAmount = typedEntries.reduce((sum, entry) => sum + entry.amount, 0);
  if (!totalAmount) {
    return [];
  }

  const amountByCategory = new Map<string, number>();
  for (const entry of typedEntries) {
    const categoryLabel = entry.category.trim() || EMPTY_CATEGORY_LABEL;
    amountByCategory.set(categoryLabel, (amountByCategory.get(categoryLabel) ?? 0) + entry.amount);
  }

  return [...amountByCategory.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([category, amount]) => ({
      amount,
      category,
      share: amount / totalAmount,
    }));
}

function buildMemberExpenses(entries: LedgerEntry[]): MonthlyMemberExpense[] {
  return buildMemberBreakdown(entries, "expense");
}

function buildMemberIncomes(entries: LedgerEntry[]): MonthlyMemberIncome[] {
  return buildMemberBreakdown(entries, "income");
}

function buildMemberBreakdown(
  entries: LedgerEntry[],
  type: "expense" | "income",
): MonthlyMemberExpense[] {
  const typedEntries = entries.filter((entry) => entry.type === type);
  const totalAmount = typedEntries.reduce((sum, entry) => sum + entry.amount, 0);
  if (!totalAmount) {
    return [];
  }

  const amountByMember = new Map<string, number>();
  for (const entry of typedEntries) {
    const memberName =
      entry.targetMemberName?.trim() || entry.authorName?.trim() || DEFAULT_MEMBER_DISPLAY_NAME;
    amountByMember.set(memberName, (amountByMember.get(memberName) ?? 0) + entry.amount);
  }

  return [...amountByMember.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([memberName, amount]) => ({
      amount,
      memberName,
      share: amount / totalAmount,
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

function buildTrendMonthsFromInputs(trendInputs: MonthlyTrendInput[]): MonthlyTrendPoint[] {
  const currentTrendKey = trendInputs[trendInputs.length - 1]?.month;
  const currentKey = currentTrendKey ? toMonthKey(currentTrendKey) : null;

  return trendInputs.map(({ entries, label, month }) => ({
    expenseAmount: sumEntriesByType(entries, "expense"),
    incomeAmount: sumEntriesByType(entries, "income"),
    isCurrentMonth: toMonthKey(month) === currentKey,
    key: toMonthKey(month),
    monthLabel: label ?? formatCompactMonthLabel(month),
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
