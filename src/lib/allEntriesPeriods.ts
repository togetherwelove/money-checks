import type { AllEntriesDateRange, AllEntriesPeriodPreset } from "../constants/allEntries";
import { addDays, addMonths, startOfMonth, toIsoDate } from "../utils/calendar";

const MONTHS_PER_YEAR = 12;
export function resolveAllEntriesPeriod(
  preset: AllEntriesPeriodPreset,
  now = new Date(),
): AllEntriesDateRange {
  const monthStart = startOfMonth(now);
  const start =
    preset === "this-year"
      ? addMonths(monthStart, -now.getMonth())
      : preset === "last-month"
        ? addMonths(monthStart, -1)
        : monthStart;
  const next = addMonths(start, preset === "this-year" ? MONTHS_PER_YEAR : 1);
  return { startDate: toIsoDate(start), endDate: toIsoDate(addDays(next, -1)) };
}
