import { CalendarDayUi } from "../../constants/calendarDay";
import type { CalendarDay } from "../../types/ledger";

export const CALENDAR_WEEK_ROWS = 6;
export const CALENDAR_DAYS_PER_WEEK = 7;

export const CALENDAR_DAY_CELL_BORDER_WIDTH = 1;
export const CALENDAR_DAY_CONTENT_GAP = 1;
export const CALENDAR_DAY_NUMBER_BORDER_WIDTH = 1;
export const CALENDAR_DAY_NUMBER_LINE_HEIGHT = 14;
export const CALENDAR_DAY_NUMBER_PADDING_VERTICAL = 1;
export const CALENDAR_DAY_NUMBER_WIDTH = 24;

export const CALENDAR_DAY_NUMBER_HEIGHT =
  CALENDAR_DAY_NUMBER_LINE_HEIGHT +
  CALENDAR_DAY_NUMBER_PADDING_VERTICAL * 2 +
  CALENDAR_DAY_NUMBER_BORDER_WIDTH * 2;
const CALENDAR_MAX_AMOUNT_LINE_COUNT = 2;
export const CALENDAR_AMOUNT_SPACE_HEIGHT =
  CALENDAR_MAX_AMOUNT_LINE_COUNT * CalendarDayUi.amountLineHeight;

export const CALENDAR_MAX_HEIGHT =
  CALENDAR_WEEK_ROWS * resolveCalendarWeekHeightForAmountLineCount(CALENDAR_MAX_AMOUNT_LINE_COUNT);

export function resolveCalendarWeekHeight(_week: readonly CalendarDay[]): number {
  return resolveCalendarWeekHeightForAmountLineCount(CALENDAR_MAX_AMOUNT_LINE_COUNT);
}

function resolveCalendarWeekHeightForAmountLineCount(amountLineCount: number): number {
  const amountBlockHeight =
    amountLineCount > 0
      ? CALENDAR_DAY_CONTENT_GAP + amountLineCount * CalendarDayUi.amountLineHeight
      : CALENDAR_DAY_CONTENT_GAP + CALENDAR_AMOUNT_SPACE_HEIGHT;

  return CALENDAR_DAY_CELL_BORDER_WIDTH * 2 + CALENDAR_DAY_NUMBER_HEIGHT + amountBlockHeight;
}
