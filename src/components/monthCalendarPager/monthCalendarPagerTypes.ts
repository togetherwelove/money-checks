import type { MonthPage } from "./monthCalendarPagerUtils";

export type MonthCalendarPagerProps = {
  currentPage: MonthPage;
  nextPage: MonthPage;
  onMoveMonth: (monthOffset: number) => void;
  onSelectDate: (isoDate: string) => void;
  previousPage: MonthPage;
  selectedDate: string;
};
