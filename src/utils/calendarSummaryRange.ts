import { CalendarSummaryBaseDay } from "../constants/calendarSummary";
import { addDays, addMonths, toIsoDate } from "./calendar";

type CalendarSummaryRange = {
  endDate: string;
  label: string;
  startDate: string;
};

const RANGE_LABEL_DATE_SEPARATOR = " ~ ";
const SELECTED_MONTH_RANGE_MONTH_OFFSET = 1;
const SELECTED_MONTH_PREVIOUS_RANGE_OFFSET = -1;
const MONTH_HALF_DIVISOR = 2;
const PREVIOUS_DAY_OFFSET = -1;

export function buildSelectedMonthSummaryRangeForMonth(
  monthDate: Date,
  baseDay: number,
): CalendarSummaryRange {
  const rangeBaseMonthDate = resolveSelectedMonthRangeBaseMonth(monthDate, baseDay);
  const startDate = new Date(
    rangeBaseMonthDate.getFullYear(),
    rangeBaseMonthDate.getMonth(),
    clampDayToMonth(rangeBaseMonthDate.getFullYear(), rangeBaseMonthDate.getMonth(), baseDay),
  );
  const nextStartDate = new Date(
    rangeBaseMonthDate.getFullYear(),
    rangeBaseMonthDate.getMonth() + SELECTED_MONTH_RANGE_MONTH_OFFSET,
    clampDayToMonth(
      rangeBaseMonthDate.getFullYear(),
      rangeBaseMonthDate.getMonth() + SELECTED_MONTH_RANGE_MONTH_OFFSET,
      baseDay,
    ),
  );
  const endDate = addDays(nextStartDate, PREVIOUS_DAY_OFFSET);

  return createCalendarSummaryRange(startDate, endDate);
}

function resolveSelectedMonthRangeBaseMonth(monthDate: Date, baseDay: number): Date {
  const currentMonthDay = clampDayToMonth(monthDate.getFullYear(), monthDate.getMonth(), baseDay);
  const lastDayOfCurrentMonth = getLastDayOfMonth(monthDate.getFullYear(), monthDate.getMonth());
  const isAfterMonthHalf = currentMonthDay > lastDayOfCurrentMonth / MONTH_HALF_DIVISOR;

  return isAfterMonthHalf ? addMonths(monthDate, SELECTED_MONTH_PREVIOUS_RANGE_OFFSET) : monthDate;
}

function createCalendarSummaryRange(startDate: Date, endDate: Date): CalendarSummaryRange {
  return {
    endDate: toIsoDate(endDate),
    label: `${formatCompactDate(startDate)}${RANGE_LABEL_DATE_SEPARATOR}${formatCompactDate(
      endDate,
    )}`,
    startDate: toIsoDate(startDate),
  };
}

function clampDayToMonth(year: number, monthIndex: number, day: number): number {
  const normalizedDay = Math.min(
    CalendarSummaryBaseDay.max,
    Math.max(CalendarSummaryBaseDay.min, day),
  );
  return Math.min(normalizedDay, getLastDayOfMonth(year, monthIndex));
}

function getLastDayOfMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + SELECTED_MONTH_RANGE_MONTH_OFFSET, 0).getDate();
}

function formatCompactDate(date: Date): string {
  return `${date.getMonth() + 1}.${date.getDate()}`;
}
