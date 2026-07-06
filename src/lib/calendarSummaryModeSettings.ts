import {
  CalendarSummaryBaseDay,
  type CalendarSummaryMode,
  CalendarSummaryModes,
} from "../constants/calendarSummary";
import { appStorage } from "./appStorage";

const CALENDAR_SUMMARY_BASE_DAY_STORAGE_KEY = "money-checks.settings.calendar-summary-base-day";
const LEGACY_CALENDAR_SUMMARY_BASE_DATE_STORAGE_KEY =
  "money-checks.settings.calendar-summary-base-date";
const CALENDAR_SUMMARY_MODE_STORAGE_KEY = "money-checks.settings.calendar-summary-mode";
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function readCalendarSummaryBaseDay(): number | null {
  const storedValue = appStorage.getItem(CALENDAR_SUMMARY_BASE_DAY_STORAGE_KEY);
  const storedDay = Number(storedValue);
  if (isCalendarSummaryBaseDay(storedDay)) {
    return storedDay;
  }

  const legacyValue = appStorage.getItem(LEGACY_CALENDAR_SUMMARY_BASE_DATE_STORAGE_KEY);
  if (!isIsoDate(legacyValue)) {
    return null;
  }

  const legacyDay = Number(legacyValue.slice(-2));
  return isCalendarSummaryBaseDay(legacyDay) ? legacyDay : null;
}

export function readCalendarSummaryMode(): CalendarSummaryMode {
  const storedValue = appStorage.getItem(CALENDAR_SUMMARY_MODE_STORAGE_KEY);
  return isCalendarSummaryMode(storedValue) ? storedValue : CalendarSummaryModes.monthly;
}

export function writeCalendarSummaryBaseDay(day: number): void {
  appStorage.setItem(CALENDAR_SUMMARY_BASE_DAY_STORAGE_KEY, String(day));
}

export function writeCalendarSummaryMode(mode: CalendarSummaryMode): void {
  appStorage.setItem(CALENDAR_SUMMARY_MODE_STORAGE_KEY, mode);
}

function isCalendarSummaryMode(value: string | null): value is CalendarSummaryMode {
  return (
    value === CalendarSummaryModes.monthly ||
    value === CalendarSummaryModes.all ||
    value === CalendarSummaryModes.selectedMonth
  );
}

function isIsoDate(value: string | null): value is string {
  return typeof value === "string" && ISO_DATE_PATTERN.test(value);
}

function isCalendarSummaryBaseDay(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= CalendarSummaryBaseDay.min &&
    value <= CalendarSummaryBaseDay.max
  );
}
