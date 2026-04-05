import type { LedgerEntryType } from "../types/ledger";

type EntryDirectionDefinition = {
  description: string;
  label: string;
};

export const EntryDirectionCopy: Record<LedgerEntryType, EntryDirectionDefinition> = {
  expense: {
    label: "지출",
    description: "나간 돈을 기록합니다.",
  },
  income: {
    label: "수입",
    description: "들어온 돈을 기록합니다.",
  },
};
