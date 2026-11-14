import type { LedgerEntryType } from "../../types/ledger";
import type { ReactNode } from "react";

export type EntryComposerHeaderProps = {
  title?: string;
  centerContent?: ReactNode;
  type?: LedgerEntryType;
  onSelectType?: (type: LedgerEntryType) => void;
  typeDisabled?: boolean;
  saving?: boolean;
  actionDisabled?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
};
