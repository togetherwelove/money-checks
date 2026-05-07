import type { CalendarDay } from "../../types/ledger";
import { CALENDAR_DAYS_PER_WEEK } from "./calendarLayout";

export function getCalendarWeekCount(days: CalendarDay[]): number {
  return getVisibleCalendarWeeks(days).length;
}

export function getVisibleCalendarDays(days: CalendarDay[]): CalendarDay[] {
  return getVisibleCalendarWeeks(days).flat();
}

export function getVisibleCalendarWeeks(days: CalendarDay[]): CalendarDay[][] {
  return chunkDays(days).filter(weekHasCurrentMonth);
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
