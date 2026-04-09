import { DateNavigationToolbar } from "./DateNavigationToolbar";

type EntryDateToolbarProps = {
  dateLabel: string;
  onPressDateLabel: () => void;
  onMoveToToday: () => void;
  showMoveToToday: boolean;
};

export function EntryDateToolbar({
  dateLabel,
  onPressDateLabel,
  onMoveToToday,
  showMoveToToday,
}: EntryDateToolbarProps) {
  return (
    <DateNavigationToolbar
      label={dateLabel}
      onMoveToCurrent={onMoveToToday}
      onPressLabel={onPressDateLabel}
      showMoveToCurrent={showMoveToToday}
    />
  );
}
