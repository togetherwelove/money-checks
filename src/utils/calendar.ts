import {
  CALENDAR_DAYS_PER_WEEK,
  CALENDAR_WEEK_ROWS,
} from "../components/monthCalendarPager/calendarLayout";
import {
  EMPTY_CATEGORY_LABEL,
  KRW_CURRENCY_SUFFIX,
  formatMonthLabel,
} from "../constants/ledgerDisplay";
import type { CalendarDay, LedgerEntry, MonthlyLedgerSummary } from "../types/ledger";
import { formatAmountNumber } from "./amount";

const selectedDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  weekday: "short",
});
const selectedDateWithYearFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
});

type DayAggregate = {
  income: number;
  expense: number;
  note: string;
};

export function formatCurrency(amount: number): string {
  return `${formatAmountNumber(amount)}${KRW_CURRENCY_SUFFIX}`;
}

export function formatSelectedDate(isoDate: string): string {
  return formatDateWithOptionalYear(parseIsoDate(isoDate), false);
}

export function formatSelectedDateWithYear(isoDate: string): string {
  return formatDateWithOptionalYear(parseIsoDate(isoDate), true);
}

export function formatLedgerListHeaderDate(isoDate: string): string {
  return formatDateWithOptionalYear(parseIsoDate(isoDate), true);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, monthOffset: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + monthOffset, 1);
}

export function replaceMonthAndYear(date: Date, year: number, monthIndex: number): Date {
  return new Date(year, monthIndex, 1);
}

export function replaceYearPreservingMonth(date: Date, year: number): Date {
  return replaceMonthAndYear(date, year, date.getMonth());
}

export function addDays(date: Date, dayOffset: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + dayOffset);
}

export function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(isoDate: string): Date {
  const [yearText, monthText, dayText] = isoDate.split("-");
  return new Date(Number(yearText), Number(monthText) - 1, Number(dayText));
}

export function buildMonthlyLedger(
  monthKey: string,
  entries: LedgerEntry[],
  todayKey?: string,
): MonthlyLedgerSummary {
  const monthDate = parseMonthKey(monthKey);
  const monthEntries = entries.filter((entry) => entry.date.startsWith(`${monthKey}-`));
  const todayIso = todayKey ?? toIsoDate(new Date());
  const dayMap = groupEntriesByDate(entries);
  const summary = buildSummary(monthEntries);

  return {
    monthLabel: formatMonthLabel(monthDate),
    totalIncome: summary.totalIncome,
    totalExpense: summary.totalExpense,
    balance: summary.totalIncome - summary.totalExpense,
    topExpenseCategory: summary.topExpenseCategory,
    days: buildCalendarDays(monthDate, dayMap, todayIso),
  };
}

function buildCalendarDays(
  monthDate: Date,
  dayMap: Map<string, DayAggregate>,
  todayIso: string,
): CalendarDay[] {
  const firstDay = startOfMonth(monthDate);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const totalCells = CALENDAR_WEEK_ROWS * CALENDAR_DAYS_PER_WEEK;
  const previousMonth = addMonths(monthDate, -1);
  const nextMonth = addMonths(monthDate, 1);
  const previousMonthLastDay = new Date(
    previousMonth.getFullYear(),
    previousMonth.getMonth() + 1,
    0,
  ).getDate();

  return Array.from({ length: totalCells }, (_, index) => {
    if (index < startOffset) {
      const previousMonthDay = previousMonthLastDay - startOffset + index + 1;
      return createCalendarDay(
        new Date(previousMonth.getFullYear(), previousMonth.getMonth(), previousMonthDay),
        false,
        dayMap,
        todayIso,
      );
    }

    const currentMonthDay = index - startOffset + 1;
    if (currentMonthDay <= daysInMonth) {
      return createCalendarDay(
        new Date(monthDate.getFullYear(), monthDate.getMonth(), currentMonthDay),
        true,
        dayMap,
        todayIso,
      );
    }

    const nextMonthDay = currentMonthDay - daysInMonth;
    return createCalendarDay(
      new Date(nextMonth.getFullYear(), nextMonth.getMonth(), nextMonthDay),
      false,
      dayMap,
      todayIso,
    );
  });
}

function buildSummary(entries: LedgerEntry[]) {
  const totalIncome = entries
    .filter((entry) => entry.type === "income")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const totalExpense = entries
    .filter((entry) => entry.type === "expense")
    .reduce((sum, entry) => sum + entry.amount, 0);

  const expenseTotals = new Map<string, number>();
  for (const entry of entries) {
    if (entry.type !== "expense") {
      continue;
    }

    expenseTotals.set(entry.category, (expenseTotals.get(entry.category) ?? 0) + entry.amount);
  }

  const topExpenseCategory =
    [...expenseTotals.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
    EMPTY_CATEGORY_LABEL;

  return { totalIncome, totalExpense, topExpenseCategory };
}

function groupEntriesByDate(entries: LedgerEntry[]): Map<string, DayAggregate> {
  const grouped = new Map<string, DayAggregate>();

  for (const entry of entries) {
    const current = grouped.get(entry.date) ?? { income: 0, expense: 0, note: entry.note };
    grouped.set(entry.date, {
      income: entry.type === "income" ? current.income + entry.amount : current.income,
      expense: entry.type === "expense" ? current.expense + entry.amount : current.expense,
      note: current.note,
    });
  }

  return grouped;
}

function createCalendarDay(
  date: Date,
  isCurrentMonth: boolean,
  dayMap: Map<string, DayAggregate>,
  todayIso: string,
): CalendarDay {
  const isoDate = toIsoDate(date);
  const aggregate = dayMap.get(isoDate);

  return {
    isoDate,
    dayNumber: String(date.getDate()),
    income: aggregate?.income ?? 0,
    expense: aggregate?.expense ?? 0,
    balance: (aggregate?.income ?? 0) - (aggregate?.expense ?? 0),
    note: aggregate?.note ?? "",
    isCurrentMonth,
    isToday: isoDate === todayIso,
  };
}

function parseMonthKey(monthKey: string): Date {
  const [yearText, monthText] = monthKey.split("-");
  return new Date(Number(yearText), Number(monthText) - 1, 1);
}

function formatDateWithOptionalYear(date: Date, includeYear: boolean): string {
  const formatter = includeYear ? selectedDateWithYearFormatter : selectedDateFormatter;
  const formatted = formatter.formatToParts(date);
  const year = formatted.find((part) => part.type === "year")?.value;
  const month = formatted.find((part) => part.type === "month")?.value;
  const day = formatted.find((part) => part.type === "day")?.value;
  const weekday = formatted.find((part) => part.type === "weekday")?.value;

  if (!month || !day || !weekday || (includeYear && !year)) {
    return formatter.format(date);
  }

  return includeYear
    ? `${year}년 ${month} ${day}일 (${weekday})`
    : `${month} ${day}일 (${weekday})`;
}
