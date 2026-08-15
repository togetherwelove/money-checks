import type { LedgerEntry } from "./ledger";

export type InstallmentPrepaymentPreview = {
  installmentCount: number;
  totalAmount: number;
};

export type InstallmentPrepaymentResult = InstallmentPrepaymentPreview & {
  deletedEntryIds: string[];
  prepaidEntryId: string;
  updatedEntries: LedgerEntry[];
};

export type InstallmentPrepaymentHandler = (entry: LedgerEntry) => Promise<boolean>;
