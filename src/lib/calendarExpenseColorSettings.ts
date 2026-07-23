import {
  type CalendarExpenseColorMode,
  CalendarExpenseColorModes,
  CalendarExpenseColorStorage,
} from "../constants/calendarExpenseColor";
import { appStorage } from "./appStorage";

export function readCalendarExpenseColorMode(): CalendarExpenseColorMode {
  const storedValue = appStorage.getItem(CalendarExpenseColorStorage.key);
  return isCalendarExpenseColorMode(storedValue)
    ? storedValue
    : CalendarExpenseColorModes.defaultText;
}

export function writeCalendarExpenseColorMode(mode: CalendarExpenseColorMode): void {
  appStorage.setItem(CalendarExpenseColorStorage.key, mode);
}

function isCalendarExpenseColorMode(value: string | null): value is CalendarExpenseColorMode {
  return (
    value === CalendarExpenseColorModes.defaultText ||
    value === CalendarExpenseColorModes.expense
  );
}
