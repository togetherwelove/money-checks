import { useState } from "react";

import type { CalendarSummaryMode } from "../constants/calendarSummary";
import {
  readCalendarSummaryBaseDay,
  readCalendarSummaryMode,
  writeCalendarSummaryBaseDay,
  writeCalendarSummaryMode,
} from "../lib/calendarSummaryModeSettings";

export function useCalendarSummaryModeSetting() {
  const [calendarSummaryBaseDay, setCalendarSummaryBaseDay] = useState(
    readCalendarSummaryBaseDay,
  );
  const [calendarSummaryMode, setCalendarSummaryMode] = useState(readCalendarSummaryMode);

  const updateCalendarSummaryBaseDay = (day: number) => {
    setCalendarSummaryBaseDay(day);
    writeCalendarSummaryBaseDay(day);
  };

  const updateCalendarSummaryMode = (mode: CalendarSummaryMode) => {
    setCalendarSummaryMode(mode);
    writeCalendarSummaryMode(mode);
  };

  return {
    calendarSummaryBaseDay,
    calendarSummaryMode,
    updateCalendarSummaryBaseDay,
    updateCalendarSummaryMode,
  };
}
