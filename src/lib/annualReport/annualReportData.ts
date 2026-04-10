import type { LedgerEntry, LedgerEntryType } from "../../types/ledger";
import { formatCurrency } from "../../utils/calendar";

export type AnnualReportMonthRow = {
  balance: number;
  expense: number;
  income: number;
  month: number;
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
  totalExpense: number;
  totalIncome: number;
  year: number;
};

export function buildAnnualReportData(
  bookName: string,
  entries: LedgerEntry[],
  year: number,
): AnnualReportData {
  const monthlyRows = Array.from({ length: 12 }, (_value, monthIndex) =>
    buildMonthRow(entries, monthIndex + 1),
  );
  const totalIncome = monthlyRows.reduce((sum, row) => sum + row.income, 0);
  const totalExpense = monthlyRows.reduce((sum, row) => sum + row.expense, 0);

  return {
    bookName,
    entries,
    expenseCategories: buildCategoryRows(entries, "expense"),
    generatedAtLabel: new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date()),
    incomeCategories: buildCategoryRows(entries, "income"),
    monthlyRows,
    totalExpense,
    totalIncome,
    year,
  };
}

export function formatSignedReportAmount(amount: number, type: LedgerEntryType): string {
  const prefix = type === "income" ? "+" : "-";
  return `${prefix} ${formatCurrency(amount)}`;
}

function buildMonthRow(entries: LedgerEntry[], month: number): AnnualReportMonthRow {
  const monthPrefix = `${String(month).padStart(2, "0")}-`;
  const monthEntries = entries.filter((entry) => entry.date.slice(5).startsWith(monthPrefix));
  const income = sumAmountByType(monthEntries, "income");
  const expense = sumAmountByType(monthEntries, "expense");

  return {
    balance: income - expense,
    expense,
    income,
    month,
    monthLabel: `${month}월`,
  };
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
