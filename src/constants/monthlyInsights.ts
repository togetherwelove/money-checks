import { selectStaticCopy } from "../i18n/staticCopy";
import { AppChartColors } from "./colors";

export const MONTHLY_INSIGHT_CHART_COLORS = AppChartColors;

export const MonthlyInsightCopy = selectStaticCopy({
  en: {
    categoryEmpty: "No expenses this month, so the category chart is hidden.",
    categoryTitle: "Category Expenses",
    chartCenterLabel: "Total Expense",
    comparisonSame: "Same as last month",
    comparisonTitle: "Previous Month",
    expenseTitle: "Expense",
    incomeTitle: "Income",
    previousMonthPrefix: "Previous",
    shareUnit: "%",
  },
  ko: {
    categoryEmpty: "이번 달 지출이 없어 카테고리 차트를 표시하지 않을게요.",
    categoryTitle: "카테고리 지출",
    chartCenterLabel: "총지출",
    comparisonSame: "전월과 같아요",
    comparisonTitle: "전월 비교",
    expenseTitle: "지출",
    incomeTitle: "수입",
    previousMonthPrefix: "전월",
    shareUnit: "%",
  },
} as const);
