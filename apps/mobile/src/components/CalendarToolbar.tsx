import { DateNavigationToolbar } from "./DateNavigationToolbar";

type CalendarToolbarProps = {
  monthLabel: string;
  onMoveNextMonth: () => void;
  onMovePreviousMonth: () => void;
  onMoveToCurrentMonth: () => void;
  onPressMonthLabel: () => void;
};

export function CalendarToolbar({
  monthLabel,
  onMoveNextMonth,
  onMovePreviousMonth,
  onMoveToCurrentMonth,
  onPressMonthLabel,
}: CalendarToolbarProps) {
  return (
    <DateNavigationToolbar
      label={monthLabel}
      onMoveNext={onMoveNextMonth}
      onMovePrevious={onMovePreviousMonth}
      onMoveToCurrent={onMoveToCurrentMonth}
      onPressLabel={onPressMonthLabel}
    />
  );
}
