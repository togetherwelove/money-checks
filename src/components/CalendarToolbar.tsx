import { DateNavigationToolbar } from "./DateNavigationToolbar";

type CalendarToolbarProps = {
  monthLabel: string;
  onPressMonthLabel?: (() => void) | null;
};

export function CalendarToolbar({
  monthLabel,
  onPressMonthLabel = null,
}: CalendarToolbarProps) {
  return (
    <DateNavigationToolbar
      label={monthLabel}
      onPressLabel={onPressMonthLabel}
    />
  );
}
