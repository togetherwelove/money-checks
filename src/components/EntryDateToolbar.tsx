import { DateNavigationToolbar } from "./DateNavigationToolbar";

type EntryDateToolbarProps = {
  dateLabel: string;
  onMoveNextDay: () => void;
  onMovePreviousDay: () => void;
  onPressDateLabel: () => void;
  onMoveToToday: () => void;
};

export function EntryDateToolbar({
  dateLabel,
  onMoveNextDay,
  onMovePreviousDay,
  onPressDateLabel,
  onMoveToToday,
}: EntryDateToolbarProps) {
  return (
    <DateNavigationToolbar
      label={dateLabel}
      onMoveNext={onMoveNextDay}
      onMovePrevious={onMovePreviousDay}
      onMoveToCurrent={onMoveToToday}
      onPressLabel={onPressDateLabel}
    />
  );
}
