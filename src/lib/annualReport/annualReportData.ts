import { DEFAULT_MEMBER_DISPLAY_NAME } from "../../constants/ledgerDisplay";
import { resolveStaticCopyLanguage } from "../../i18n/staticCopy";
import type { LedgerEntry, LedgerEntryType } from "../../types/ledger";
import { formatMonthYear, getMonthKey, parseIsoDate, startOfMonth } from "../../utils/calendar";

const ANNUAL_REPORT_DATE_LOCALE = resolveStaticCopyLanguage() === "en" ? "en-US" : "ko-KR";

export type AnnualReportMonthRow = {
  balance: number;
  count: number;
  expense: number;
  income: number;
  monthKey: string;
  monthLabel: string;
};

export type AnnualReportCategoryRow = {
  amount: number;
  category: string;
  count: number;
  share: number;
  type: LedgerEntryType;
};

export type AnnualReportMemberRow = {
  balance: number;
  count: number;
  expense: number;
  income: number;
  memberName: string;
};

export type AnnualReportData = {
  bookName: string;
  entries: LedgerEntry[];
  expenseCategories: AnnualReportCategoryRow[];
  generatedAtLabel: string;
  incomeCategories: AnnualReportCategoryRow[];
  memberRows: AnnualReportMemberRow[];
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
    generatedAtLabel: new Intl.DateTimeFormat(ANNUAL_REPORT_DATE_LOCALE, {
      dateStyle: "medium",
    }).format(new Date()),
    incomeCategories: buildCategoryRows(entries, "income"),
    memberRows: buildMemberRows(entries),
    monthlyRows,
    periodLabel,
    totalExpense,
    totalIncome,
  };
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
      count: monthEntries.length,
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
  const countByCategory = new Map<string, number>();

  for (const entry of filteredEntries) {
    amountByCategory.set(
      entry.category,
      (amountByCategory.get(entry.category) ?? 0) + entry.amount,
    );
    countByCategory.set(entry.category, (countByCategory.get(entry.category) ?? 0) + 1);
  }

  return [...amountByCategory.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([category, amount]) => ({
      amount,
      category,
      count: countByCategory.get(category) ?? 0,
      share: totalAmount ? amount / totalAmount : 0,
      type,
    }));
}

function sumAmountByType(entries: LedgerEntry[], type: LedgerEntryType) {
  return entries
    .filter((entry) => entry.type === type)
    .reduce((sum, entry) => sum + entry.amount, 0);
}

function buildMemberRows(entries: LedgerEntry[]): AnnualReportMemberRow[] {
  const amountByMember = new Map<string, { count: number; income: number; expense: number }>();

  for (const entry of entries) {
    const memberName = entry.targetMemberName || entry.authorName || DEFAULT_MEMBER_DISPLAY_NAME;
    const currentAmount = amountByMember.get(memberName) ?? { count: 0, income: 0, expense: 0 };
    amountByMember.set(memberName, {
      count: currentAmount.count + 1,
      income: entry.type === "income" ? currentAmount.income + entry.amount : currentAmount.income,
      expense:
        entry.type === "expense" ? currentAmount.expense + entry.amount : currentAmount.expense,
    });
  }

  return [...amountByMember.entries()]
    .map(([memberName, amount]) => ({
      balance: amount.income - amount.expense,
      count: amount.count,
      expense: amount.expense,
      income: amount.income,
      memberName,
    }))
    .sort((left, right) => right.income + right.expense - (left.income + left.expense));
}
