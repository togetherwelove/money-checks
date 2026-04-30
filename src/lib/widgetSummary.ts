import { KRW_CURRENCY_SUFFIX } from "../constants/ledgerDisplay";
import { LedgerWidgetConfig } from "../constants/widget";
import type { LedgerEntry } from "../types/ledger";
import type { LedgerWidgetSummary } from "../types/widget";
import { formatAmountNumber } from "../utils/amount";
import { formatEntryMetaDate } from "../utils/calendar";
import { supabase } from "./supabase";

const EMPTY_AMOUNT_LABEL = `0${KRW_CURRENCY_SUFFIX}`;

type LedgerWidgetSummaryRpcRow = {
  month_expense_amount: number | string;
  month_income_amount: number | string;
  recent_entries: unknown;
  today_expense_amount: number | string;
  today_income_amount: number | string;
};

type LedgerWidgetRecentEntryRpcRow = {
  amount: number | string;
  content: string;
  date: string;
  type: LedgerEntry["type"];
};

export async function fetchLedgerWidgetSummary(
  bookId: string,
  todayIsoDate: string,
): Promise<LedgerWidgetSummary> {
  const { data, error } = await supabase
    .rpc("get_ledger_widget_summary", {
      p_book_id: bookId,
      p_recent_limit: LedgerWidgetConfig.maxRecentEntries,
      p_today: todayIsoDate,
    })
    .maybeSingle<LedgerWidgetSummaryRpcRow>();

  if (error) {
    throw error;
  }

  return mapLedgerWidgetSummaryRpcRow(data, todayIsoDate);
}

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

function mapLedgerWidgetSummaryRpcRow(
  row: LedgerWidgetSummaryRpcRow | null,
  todayIsoDate: string,
): LedgerWidgetSummary {
  const monthIncomeAmount = toAmountNumber(row?.month_income_amount);
  const monthExpenseAmount = toAmountNumber(row?.month_expense_amount);
  const recentEntries = Array.isArray(row?.recent_entries) ? row.recent_entries : [];

  return {
    todayIncomeLabel: formatWidgetAmount(toAmountNumber(row?.today_income_amount)),
    todayExpenseLabel: formatWidgetAmount(toAmountNumber(row?.today_expense_amount)),
    monthIncomeAmount,
    monthIncomeLabel: formatWidgetAmount(monthIncomeAmount),
    monthExpenseAmount,
    monthExpenseLabel: formatWidgetAmount(monthExpenseAmount),
    recentEntries: recentEntries
      .filter(isLedgerWidgetRecentEntryRpcRow)
      .slice(0, LedgerWidgetConfig.maxRecentEntries)
      .map((entry) => ({
        amountLabel: formatWidgetAmount(toAmountNumber(entry.amount)),
        dateLabel: formatEntryMetaDate(entry.date || todayIsoDate),
        title: entry.content,
        type: entry.type,
      })),
  };
}

function isLedgerWidgetRecentEntryRpcRow(value: unknown): value is LedgerWidgetRecentEntryRpcRow {
  const candidate = value as Partial<LedgerWidgetRecentEntryRpcRow> | null;
  return (
    typeof candidate === "object" &&
    candidate !== null &&
    (typeof candidate.amount === "number" || typeof candidate.amount === "string") &&
    typeof candidate.content === "string" &&
    typeof candidate.date === "string" &&
    (candidate.type === "income" || candidate.type === "expense")
  );
}

function toAmountNumber(value: number | string | null | undefined): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value) || 0;
  }

  return 0;
}

function compareLedgerEntriesByRecentDate(left: LedgerEntry, right: LedgerEntry): number {
  if (left.date !== right.date) {
    return right.date.localeCompare(left.date);
  }

  return right.id.localeCompare(left.id);
}
