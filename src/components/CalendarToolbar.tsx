import { DateNavigationToolbar } from "./DateNavigationToolbar";

type CalendarToolbarProps = {
  monthLabel: string;
  onSelectToday: () => void;
  showMoveToCurrent: boolean;
};

export function CalendarToolbar({
  monthLabel,
  onSelectToday,
  showMoveToCurrent,
}: CalendarToolbarProps) {
  return (
    <DateNavigationToolbar
      label={monthLabel}
      onMoveToCurrent={onSelectToday}
      showMoveToCurrent={showMoveToCurrent}
    />
  );
}
