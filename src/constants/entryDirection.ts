import type { LedgerEntryType } from "../types/ledger";

type EntryDirectionDefinition = {
  label: string;
};

export const EntryDirectionCopy: Record<LedgerEntryType, EntryDirectionDefinition> = {
  expense: {
    label: "지출",
  },
  income: {
    label: "수입",
  },
};

export const EntryDirectionOrder: LedgerEntryType[] = ["expense", "income"];

export const EntryDirectionLayout = {
  containerInset: 4,
  containerRadius: 18,
  optionCount: EntryDirectionOrder.length,
  optionGap: 4,
  optionRadius: 14,
  optionMinHeight: 44,
  slideDurationMs: 180,
} as const;
