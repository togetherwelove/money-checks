import type { MonthPage } from "./monthCalendarPagerUtils";

export type MonthOffset = -1 | 0 | 1;

export type CalendarWeekFrame = { top: number; height: number };

export type CollapsedCalendarWeek = CalendarWeekFrame & { index: number };

export type MonthCalendarPagerProps = {
  currentPage: MonthPage;
  isCalendarHeatmapEnabled: boolean;
  isReadOnlyDueToPlanLimit?: boolean;
  nextPage: MonthPage;
  onMoveMonth: (monthOffset: MonthOffset) => void;
  onMoveWeekDate: (isoDate: string) => void;
  onSelectDate: (isoDate: string) => void;
  previousPage: MonthPage;
  selectedDate: string;
};
