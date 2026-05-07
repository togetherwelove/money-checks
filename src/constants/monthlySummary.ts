import { selectStaticCopy } from "../i18n/staticCopy";

const MonthlySummaryLocalizedCopy = selectStaticCopy({
  en: {
    balanceLabel: "Balance",
    expenseLabel: "Total Expense",
    incomeLabel: "Total Income",
  },
  ko: {
    balanceLabel: "잔액",
    expenseLabel: "총지출",
    incomeLabel: "총수입",
  },
} as const);

export const MonthlySummaryCopy = {
  ...MonthlySummaryLocalizedCopy,
  formulaEquals: "=",
  formulaMinus: "-",
  negativeSign: "- ",
  positiveSign: "+ ",
} as const;
