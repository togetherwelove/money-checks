import type { CalendarDay } from "../../types/ledger";
import { addDays, getMonthKey, parseIsoDate, toIsoDate } from "../../utils/calendar";
import { CALENDAR_DAYS_PER_WEEK } from "./calendarLayout";
import type { CalendarWeekFrame, CollapsedCalendarWeek } from "./monthCalendarPagerTypes";
import type { MonthPage } from "./monthCalendarPagerUtils";

export function getVisibleCalendarWeeks(days: CalendarDay[]): CalendarDay[][] {
  return chunkDays(days).filter(weekHasCurrentMonth);
}

export function getCollapsedCalendarWeekIndex(weeks: CalendarDay[][], selectedDate: string) {
  const selected = weeks.findIndex((week) =>
    week.some((day) => day.isCurrentMonth && day.isoDate === selectedDate),
  );
  if (selected >= 0) return selected;

  const today = weeks.findIndex((week) => week.some((day) => day.isCurrentMonth && day.isToday));
  return Math.max(today, 0);
}

export function resolveCollapsedCalendarWeek(
  days: CalendarDay[],
  monthHeight: number,
  selectedDate: string,
  measuredWeeks?: Record<number, CalendarWeekFrame>,
): CollapsedCalendarWeek {
  const weeks = getVisibleCalendarWeeks(days);
  const index = getCollapsedCalendarWeekIndex(weeks, selectedDate);
  const estimatedHeight = monthHeight / Math.max(weeks.length, 1);
  return {
    index,
    ...(measuredWeeks?.[index] ?? { top: index * estimatedHeight, height: estimatedHeight }),
  };
}

export function buildCalendarWeekNavigation(monthPages: MonthPage[], selectedDate: string) {
  const currentPage = monthPages[1];
  const weeks = getVisibleCalendarWeeks(currentPage.summary.days);
  const week = weeks[getCollapsedCalendarWeekIndex(weeks, selectedDate)];
  const anchor =
    week?.find((day) => day.isCurrentMonth && day.isoDate === selectedDate) ??
    week?.find((day) => day.isCurrentMonth && day.isToday) ??
    week?.find((day) => day.isCurrentMonth);
  if (!anchor) {
    return { pages: monthPages, dates: [undefined, selectedDate, undefined] };
  }

  const anchorDate = parseIsoDate(anchor.isoDate);
  const previous = addDays(anchorDate, -CALENDAR_DAYS_PER_WEEK);
  const next = addDays(anchorDate, CALENDAR_DAYS_PER_WEEK);
  return {
    pages: [
      monthPages.find((page) => page.key === getMonthKey(previous)) ?? currentPage,
      currentPage,
      monthPages.find((page) => page.key === getMonthKey(next)) ?? currentPage,
    ],
    dates: [toIsoDate(previous), anchor.isoDate, toIsoDate(next)],
  };
}

function chunkDays(days: CalendarDay[]): CalendarDay[][] {
  return Array.from({ length: Math.ceil(days.length / CALENDAR_DAYS_PER_WEEK) }, (_value, index) =>
    days.slice(
      index * CALENDAR_DAYS_PER_WEEK,
      index * CALENDAR_DAYS_PER_WEEK + CALENDAR_DAYS_PER_WEEK,
    ),
  );
}

function weekHasCurrentMonth(week: CalendarDay[]): boolean {
  return week.some((day) => day.isCurrentMonth);
}
