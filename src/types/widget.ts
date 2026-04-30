import type { LedgerEntryType } from "./ledger";

export type LedgerWidgetRecentEntry = {
  amountLabel: string;
  dateLabel: string;
  title: string;
  type: LedgerEntryType;
};

export type LedgerWidgetSummary = {
  monthExpenseAmount: number;
  monthExpenseLabel: string;
  monthIncomeAmount: number;
  monthIncomeLabel: string;
  recentEntries: LedgerWidgetRecentEntry[];
  todayExpenseLabel: string;
  todayIncomeLabel: string;
};
