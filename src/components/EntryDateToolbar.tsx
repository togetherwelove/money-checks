import { DateNavigationToolbar } from "./DateNavigationToolbar";

type EntryDateToolbarProps = {
  dateLabel: string;
  onPressDateLabel: () => void;
  onMoveToToday: () => void;
};

export function EntryDateToolbar({
  dateLabel,
  onPressDateLabel,
  onMoveToToday,
}: EntryDateToolbarProps) {
  return (
    <DateNavigationToolbar
      label={dateLabel}
      onMoveToCurrent={onMoveToToday}
      onPressLabel={onPressDateLabel}
    />
  );
}
