import { DEFAULT_MEMBER_DISPLAY_NAME } from "../../constants/ledgerDisplay";
import type { LedgerEntry, LedgerEntryType } from "../../types/ledger";
import { formatMonthYear, getMonthKey, parseIsoDate, startOfMonth } from "../../utils/calendar";

const ANNUAL_REPORT_DATE_LOCALE = "ko-KR";

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
  entries = entries.filter((entry) => entry.date >= dateFrom && entry.date <= dateTo);
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
  const totals = new Map<string, { income: number; expense: number; count: number }>();
  for (const entry of entries) {
    const key = entry.date.slice(0, 7);
    const total = totals.get(key) ?? { income: 0, expense: 0, count: 0 };
    total[entry.type] += entry.amount;
    total.count++;
    totals.set(key, total);
  }

  while (cursor.getTime() <= endMonth.getTime()) {
    const monthKey = getMonthKey(cursor);
    const { income = 0, expense = 0, count = 0 } = totals.get(monthKey) ?? {};

    rows.push({
      balance: income - expense,
      count,
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
  const labels = new Map<string, string>();

  for (const entry of filteredEntries) {
    const key = entry.categoryId ? `id:${entry.categoryId}` : `legacy:${entry.category}`;
    labels.set(key, entry.category);
    amountByCategory.set(
      key,
      (amountByCategory.get(key) ?? 0) + entry.amount,
    );
    countByCategory.set(key, (countByCategory.get(key) ?? 0) + 1);
  }
  const displayLabels = distinguishDuplicateNames(labels);

  return [...amountByCategory.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([key, amount]) => ({
      amount,
      category: displayLabels.get(key)!,
      count: countByCategory.get(key) ?? 0,
      share: totalAmount ? amount / totalAmount : 0,
      type,
    }));
}

function buildMemberRows(entries: LedgerEntry[]): AnnualReportMemberRow[] {
  const amountByMember = new Map<string, { count: number; income: number; expense: number }>();
  const labels = new Map<string, string>();

  for (const entry of entries) {
    const memberName = entry.targetMemberName || entry.authorName || DEFAULT_MEMBER_DISPLAY_NAME;
    const id = entry.targetMemberId || entry.authorId;
    const key = id ? `id:${id}` : `legacy:${memberName}`;
    labels.set(key, memberName);
    const currentAmount = amountByMember.get(key) ?? { count: 0, income: 0, expense: 0 };
    amountByMember.set(key, {
      count: currentAmount.count + 1,
      income: entry.type === "income" ? currentAmount.income + entry.amount : currentAmount.income,
      expense:
        entry.type === "expense" ? currentAmount.expense + entry.amount : currentAmount.expense,
    });
  }
  const displayLabels = distinguishDuplicateNames(labels);

  return [...amountByMember.entries()]
    .map(([key, amount]) => ({
      balance: amount.income - amount.expense,
      count: amount.count,
      expense: amount.expense,
      income: amount.income,
      memberName: displayLabels.get(key)!,
    }))
    .sort((left, right) => right.income + right.expense - (left.income + left.expense));
}

function distinguishDuplicateNames(labels: Map<string, string>) {
  const counts = new Map<string, number>();
  const ordinals = new Map<string, number>();
  for (const label of labels.values()) counts.set(label, (counts.get(label) ?? 0) + 1);
  return new Map([...labels].map(([key, label]) => {
    const ordinal = (ordinals.get(label) ?? 0) + 1;
    ordinals.set(label, ordinal);
    return [key, counts.get(label)! > 1 ? `${label} (${ordinal})` : label];
  }));
}
