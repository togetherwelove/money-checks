import type { LedgerEntryType } from "../types/ledger";
import { DateNavigationToolbar } from "./DateNavigationToolbar";
import { EntryTypeToggleButton } from "./EntryTypeToggleButton";

type EntryDateToolbarProps = {
  dateLabel: string;
  onPressDateLabel: () => void;
  onMoveToToday: () => void;
  onSelectType: (type: LedgerEntryType) => void;
  selectedType: LedgerEntryType;
  showMoveToToday: boolean;
};

export function EntryDateToolbar({
  dateLabel,
  onPressDateLabel,
  onMoveToToday,
  onSelectType,
  selectedType,
  showMoveToToday,
}: EntryDateToolbarProps) {
  return (
    <DateNavigationToolbar
      label={dateLabel}
      onMoveToCurrent={onMoveToToday}
      onPressLabel={onPressDateLabel}
      showMoveToCurrent={showMoveToToday}
      trailing={<EntryTypeToggleButton onSelectType={onSelectType} selectedType={selectedType} />}
    />
  );
}
