export type LedgerEntryType = "income" | "expense";

export type LedgerEntry = {
  authorId?: string;
  authorName?: string;
  id: string;
  date: string;
  type: LedgerEntryType;
  amount: number;
  category: string;
  note: string;
  sourceType?: string;
};

export type LedgerEntryDraft = {
  date: string;
  type: LedgerEntryType;
  amount: string;
  category: string;
  note: string;
};

export type CalendarDay = {
  isoDate: string;
  dayNumber: string;
  income: number;
  expense: number;
  balance: number;
  note: string;
  isCurrentMonth: boolean;
  isToday: boolean;
};

export type MonthlyLedgerSummary = {
  monthLabel: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  topExpenseCategory: string;
  days: CalendarDay[];
};
