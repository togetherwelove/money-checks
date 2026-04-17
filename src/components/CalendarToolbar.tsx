import { DateNavigationToolbar } from "./DateNavigationToolbar";

type CalendarToolbarProps = {
  monthLabel: string;
  onSelectToday: () => void;
  onPressMonthLabel?: (() => void) | null;
  showMoveToCurrent: boolean;
};

export function CalendarToolbar({
  monthLabel,
  onSelectToday,
  onPressMonthLabel = null,
  showMoveToCurrent,
}: CalendarToolbarProps) {
  return (
    <DateNavigationToolbar
      label={monthLabel}
      onMoveToCurrent={onSelectToday}
      onPressLabel={onPressMonthLabel}
      showMoveToCurrent={showMoveToCurrent}
    />
  );
}
