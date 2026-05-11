import { selectStaticCopy } from "../i18n/staticCopy";
import type { LedgerEntryType } from "../types/ledger";

export const EntryDirectionLabels = selectStaticCopy<Record<LedgerEntryType, string>>({
  en: {
    expense: "Expense",
    income: "Income",
  },
  ko: {
    expense: "지출",
    income: "수입",
  },
});

export const EntryDirectionToggleUi = {
  compactBorderRadius: 16,
  compactHeight: 32,
  compactHorizontalPadding: 0,
  compactOptionHorizontalPadding: 10,
  compactOptionMinWidth: 48,
  compactOptionOverlapOffset: -4,
  compactOptionRadius: 15,
  compactTextFontSize: 12,
  compactTextLineHeight: 16,
} as const;

export function getOppositeEntryDirection(type: LedgerEntryType): LedgerEntryType {
  return type === "expense" ? "income" : "expense";
}
