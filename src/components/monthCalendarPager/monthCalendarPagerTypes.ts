import type { MonthPage } from "./monthCalendarPagerUtils";

export type MonthOffset = -1 | 0 | 1;

export type MonthCalendarPagerProps = {
  currentPage: MonthPage;
  isCalendarHeatmapEnabled: boolean;
  isReadOnlyDueToPlanLimit?: boolean;
  nextPage: MonthPage;
  onMoveMonth: (monthOffset: MonthOffset) => void;
  onPreviewMonthOffsetChange?: (monthOffset: MonthOffset) => void;
  onSelectDate: (isoDate: string) => void;
  previousPage: MonthPage;
  selectedDate: string;
};
