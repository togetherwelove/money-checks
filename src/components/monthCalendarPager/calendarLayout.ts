import { CalendarDayUi } from "../../constants/calendarDay";
import type { CalendarDay } from "../../types/ledger";

export const CALENDAR_WEEK_ROWS = 6;
export const CALENDAR_DAYS_PER_WEEK = 7;

export const CALENDAR_DAY_CELL_PADDING_VERTICAL = 2;
export const CALENDAR_DAY_CONTENT_GAP = 1;
export const CALENDAR_DAY_NUMBER_LINE_HEIGHT = 14;
export const CALENDAR_EMPTY_AMOUNT_SPACE_HEIGHT = 6;

const CALENDAR_ROW_PADDING_VERTICAL = 1;
const CALENDAR_DAY_NUMBER_VERTICAL_PADDING = 1;
const CALENDAR_DAY_NUMBER_HEIGHT =
  CALENDAR_DAY_NUMBER_LINE_HEIGHT + CALENDAR_DAY_NUMBER_VERTICAL_PADDING * 2;
const CALENDAR_MAX_AMOUNT_LINE_COUNT = 2;

export const CALENDAR_ROW_PADDING = CALENDAR_ROW_PADDING_VERTICAL;
export const CALENDAR_MAX_HEIGHT =
  CALENDAR_WEEK_ROWS * resolveCalendarWeekHeightForAmountLineCount(CALENDAR_MAX_AMOUNT_LINE_COUNT);

export function resolveCalendarWeekHeight(week: readonly CalendarDay[]): number {
  return resolveCalendarWeekHeightForAmountLineCount(
    Math.max(...week.map(resolveVisibleAmountLineCount), 0),
  );
}

function resolveCalendarWeekHeightForAmountLineCount(amountLineCount: number): number {
  const amountBlockHeight =
    amountLineCount > 0
      ? CALENDAR_DAY_CONTENT_GAP + amountLineCount * CalendarDayUi.amountLineHeight
      : CALENDAR_DAY_CONTENT_GAP + CALENDAR_EMPTY_AMOUNT_SPACE_HEIGHT;

  return (
    CALENDAR_ROW_PADDING_VERTICAL * 2 +
    CALENDAR_DAY_CELL_PADDING_VERTICAL * 2 +
    CALENDAR_DAY_NUMBER_HEIGHT +
    amountBlockHeight
  );
}

function resolveVisibleAmountLineCount(day: CalendarDay): number {
  if (!day.isCurrentMonth) {
    return 0;
  }

  return Number(day.income > 0) + Number(day.expense > 0);
}
