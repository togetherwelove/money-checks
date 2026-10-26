import type { LedgerEntryType } from "../../types/ledger";

export type EntryComposerHeaderProps = {
  title?: string;
  type?: LedgerEntryType;
  onSelectType?: (type: LedgerEntryType) => void;
  typeDisabled?: boolean;
  saving?: boolean;
  actionDisabled?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
};
