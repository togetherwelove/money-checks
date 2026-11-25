export type CumulativeExpenseDay = {
  date: string;
  amount: number;
};

export type DailyExpenseComparison = {
  current: CumulativeExpenseDay[];
  previous: CumulativeExpenseDay[];
};
