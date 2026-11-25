import { AppFontSize, AppLineHeight } from "./typography";
import { getAppColors } from "./colors";
import { createThemeValue } from "../lib/appTheme";
export const MonthlyInsightChartCopy = {
  swipeHint: "좌우로 넘겨 다른 달을 확인하세요.",
  expenseLabel: "지출",
  incomeLabel: "수입",
  previousMonth: "지난달",
  currentMonth: "이번달",
  previousPeriod: "이전 기간",
  currentPeriod: "이번 기간",
  expenseComparisonPrefix: (previous: string) => `${previous}보다`,
  noPreviousExpense: (previous: string) => `${previous} 지출 기록이 없어요.`,
  sameExpense: (previous: string) => `${previous}과 같은 금액을 썼어요.`,
  lowerExpense: " 덜 썼어요.",
  higherExpense: " 더 썼어요.",
  expenseShareTitle: "지출 비중",
  incomeShareTitle: "수입 비중",
  shareByMember: "구성원별",
  otherShare: "그 외",
  noExpenseShare: "이 기간에는 지출 내역이 없어요.",
  noIncomeShare: "이 기간에는 수입 내역이 없어요.",
  periodTrendTitle: "최근 6개 기간 지출/수입",
  trendTitle: "최근 6개월 지출/수입",
} as const;

export const MonthlyInsightChartLayout = {
  shareItemLimit: 5,
  nativeTrendHeight: 200,
  trendLineHeight: 104,
  trendLineWidth: 2,
  trendPointRadius: 3,
  trendGridLineWidth: 1,
  trendYAxisLabelLineHeight: AppLineHeight.caption,
  trendYAxisLabelFontSize: AppFontSize.caption,
  trendYAxisGap: 4,
  trendYAxisLabelCount: 3,
  trendTooltipDurationMs: 4000,
  trendTooltipFadeMs: 160,
  trendTooltipPadding: 8,
  trendTooltipGap: 4,
  trendTooltipRadius: 8,
} as const;

export const MonthlyComparisonLayout = {
  chartMinWidth: 120,
  legendDotSize: 8,
  amountFontSize: AppFontSize.display,
  amountLineHeight: AppLineHeight.display,
  bodyGap: 5,
  dividerHeight: 1,
  headerGap: 8,
  labelFontSize: AppFontSize.caption,
  labelLineHeight: AppLineHeight.caption,
  listGap: 0,
  previousFontSize: AppFontSize.caption,
  previousLineHeight: AppLineHeight.caption,
  railRadius: 999,
  railWidth: 4,
  rowGap: 10,
  rowPaddingHorizontal: 2,
  rowPaddingVertical: 10,
  sentenceFontSize: AppFontSize.body,
  sentenceLineHeight: AppLineHeight.body,
} as const;

export const ExpenseMountainLayout = {
  width: 320,
  height: 92,
  minimumHeight: 72,
  heightToWidthRatio: 0.45,
  inset: 4,
  lineWidth: 2,
  endpointRadius: 3,
  revealDurationMs: 1400,
  endpointRevealStart: 0.98,
  previousOpacity: 0.2,
} as const;

export const getExpenseComparisonColors = createThemeValue(() => ({
  previous: getAppColors().neutralChart,
  current: getAppColors().expense,
}));
