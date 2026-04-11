import type { LedgerEntry, LedgerEntryType } from "../../types/ledger";
import {
  formatCurrency,
  formatMonthYear,
  getMonthKey,
  parseIsoDate,
  startOfMonth,
} from "../../utils/calendar";

export type AnnualReportMonthRow = {
  balance: number;
  expense: number;
  income: number;
  monthKey: string;
  monthLabel: string;
};

export type AnnualReportCategoryRow = {
  amount: number;
  category: string;
  share: number;
  type: LedgerEntryType;
};

export type AnnualReportData = {
  bookName: string;
  entries: LedgerEntry[];
  expenseCategories: AnnualReportCategoryRow[];
  generatedAtLabel: string;
  incomeCategories: AnnualReportCategoryRow[];
  monthlyRows: AnnualReportMonthRow[];
  periodLabel: string;
  totalExpense: number;
  totalIncome: number;
};

export function buildAnnualReportData(
  bookName: string,
  entries: LedgerEntry[],
  dateFrom: string,
  dateTo: string,
): AnnualReportData {
  const periodLabel = `${dateFrom} ~ ${dateTo}`;
  const monthlyRows = buildMonthRows(entries, dateFrom, dateTo);
  const totalIncome = monthlyRows.reduce((sum, row) => sum + row.income, 0);
  const totalExpense = monthlyRows.reduce((sum, row) => sum + row.expense, 0);

  return {
    bookName,
    entries,
    expenseCategories: buildCategoryRows(entries, "expense"),
    generatedAtLabel: new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date()),
    incomeCategories: buildCategoryRows(entries, "income"),
    monthlyRows,
    periodLabel,
    totalExpense,
    totalIncome,
  };
}

export function formatSignedReportAmount(amount: number, type: LedgerEntryType): string {
  const prefix = type === "income" ? "+" : "-";
  return `${prefix} ${formatCurrency(amount)}`;
}

function buildMonthRows(entries: LedgerEntry[], dateFrom: string, dateTo: string) {
  const startMonth = startOfMonth(parseIsoDate(dateFrom));
  const endMonth = startOfMonth(parseIsoDate(dateTo));
  const rows: AnnualReportMonthRow[] = [];
  const cursor = new Date(startMonth);

  while (cursor.getTime() <= endMonth.getTime()) {
    const monthKey = getMonthKey(cursor);
    const monthEntries = entries.filter((entry) => entry.date.startsWith(`${monthKey}-`));
    const income = sumAmountByType(monthEntries, "income");
    const expense = sumAmountByType(monthEntries, "expense");

    rows.push({
      balance: income - expense,
      expense,
      income,
      monthKey,
      monthLabel: formatMonthYear(cursor),
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return rows;
}

function buildCategoryRows(
  entries: LedgerEntry[],
  type: LedgerEntryType,
): AnnualReportCategoryRow[] {
  const filteredEntries = entries.filter((entry) => entry.type === type);
  const totalAmount = filteredEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const amountByCategory = new Map<string, number>();

  for (const entry of filteredEntries) {
    amountByCategory.set(
      entry.category,
      (amountByCategory.get(entry.category) ?? 0) + entry.amount,
    );
  }

  return [...amountByCategory.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([category, amount]) => ({
      amount,
      category,
      share: totalAmount ? amount / totalAmount : 0,
      type,
    }));
}

function sumAmountByType(entries: LedgerEntry[], type: LedgerEntryType) {
  return entries
    .filter((entry) => entry.type === type)
    .reduce((sum, entry) => sum + entry.amount, 0);
}
