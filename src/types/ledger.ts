export type LedgerEntryType = "income" | "expense";

export type LedgerEntry = {
  authorId?: string;
  authorName?: string;
  id: string;
  date: string;
  type: LedgerEntryType;
  amount: number;
  content: string;
  category: string;
  note: string;
  sourceType?: string;
};

export type LedgerEntryDraft = {
  date: string;
  type: LedgerEntryType;
  amount: string;
  content: string;
  category: string;
  note: string;
};

export type QueuedLedgerEntryDraft = {
  draft: LedgerEntryDraft;
  id: string;
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

export type MonthlyChangeDirection = "increase" | "decrease" | "same";

export type MonthlyComparisonMetric = {
  currentAmount: number;
  previousAmount: number;
  deltaAmount: number;
  direction: MonthlyChangeDirection;
};

export type MonthlyCategoryExpense = {
  amount: number;
  category: string;
  share: number;
};

export type MonthlyInsights = {
  currentMonthLabel: string;
  previousMonthLabel: string;
  expenseComparison: MonthlyComparisonMetric;
  incomeComparison: MonthlyComparisonMetric;
  categoryExpenses: MonthlyCategoryExpense[];
};
