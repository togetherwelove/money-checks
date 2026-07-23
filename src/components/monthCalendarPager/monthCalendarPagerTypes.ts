import type { CalendarExpenseColorMode } from "../../constants/calendarExpenseColor";
import type { MonthPage } from "./monthCalendarPagerUtils";

export type MonthCalendarPagerProps = {
  calendarExpenseColorMode: CalendarExpenseColorMode;
  currentPage: MonthPage;
  isCalendarHeatmapEnabled: boolean;
  isReadOnlyDueToPlanLimit?: boolean;
  nextPage: MonthPage;
  onMoveMonth: (monthOffset: number) => void;
  onSelectDate: (isoDate: string) => void;
  previousPage: MonthPage;
  selectedDate: string;
};
