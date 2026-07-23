import { useState } from "react";

import type { CalendarExpenseColorMode } from "../constants/calendarExpenseColor";
import {
  readCalendarExpenseColorMode,
  writeCalendarExpenseColorMode,
} from "../lib/calendarExpenseColorSettings";

export function useCalendarExpenseColorSetting() {
  const [calendarExpenseColorMode, setCalendarExpenseColorMode] = useState(
    readCalendarExpenseColorMode,
  );

  const updateCalendarExpenseColorMode = (mode: CalendarExpenseColorMode) => {
    setCalendarExpenseColorMode(mode);
    writeCalendarExpenseColorMode(mode);
  };

  return {
    calendarExpenseColorMode,
    updateCalendarExpenseColorMode,
  };
}
