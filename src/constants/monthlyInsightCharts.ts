import { selectStaticCopy } from "../i18n/staticCopy";

export const MonthlyInsightChartCopy = selectStaticCopy({
  en: {
    breakdownCategoryLabel: "By Category",
    breakdownMemberLabel: "By Member",
    categoryEmpty: "No expenses this month, so the category chart is hidden.",
    categoryTitle: "Expenses by Category",
    expenseLabel: "Expense",
    incomeLabel: "Income",
    memberEmpty: "No expenses this month, so the member chart is hidden.",
    memberTitle: "Expenses by Member",
    previousComparisonTitle: "Previous Month",
    totalExpenseLabel: "Total Expense",
    trendTitle: "6-Month Income/Expense",
  },
  ko: {
    breakdownCategoryLabel: "카테고리별",
    breakdownMemberLabel: "구성원별",
    categoryEmpty: "이번 달 지출이 없어 카테고리 차트를 표시하지 않아요.",
    categoryTitle: "카테고리별 지출",
    expenseLabel: "지출",
    incomeLabel: "수입",
    memberEmpty: "이번 달 지출이 없어 구성원 차트를 표시하지 않아요.",
    memberTitle: "구성원별 지출",
    previousComparisonTitle: "전월 비교",
    totalExpenseLabel: "총지출",
    trendTitle: "최근 6개월 수입/지출",
  },
} as const);

export const MonthlyInsightChartLayout = {
  donutSize: 152,
  donutStrokeWidth: 24,
  minVisibleBarHeight: 3,
  trendBarHeight: 104,
  trendYAxisGap: 6,
  trendYAxisLabelCount: 3,
} as const;

export const MonthlyComparisonLayout = {
  amountFontSize: 22,
  amountLineHeight: 28,
  bodyGap: 5,
  dividerHeight: 1,
  headerGap: 8,
  labelFontSize: 11,
  labelLineHeight: 15,
  listGap: 0,
  previousFontSize: 11,
  previousLineHeight: 15,
  railRadius: 999,
  railWidth: 4,
  rowGap: 10,
  rowPaddingHorizontal: 2,
  rowPaddingVertical: 10,
  sentenceFontSize: 13,
  sentenceLineHeight: 19,
} as const;
