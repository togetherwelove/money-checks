import { AppFontSize, AppLineHeight } from "./typography";
export const HomeScreenCopy = {
  todayAction: "오늘",
  todayAccessibilityLabel: "오늘 날짜로 이동",
  expandCalendar: "월간 달력 펼치기",
  collapseCalendar: "달력 접기",
} as const;

export const HomeScreenUi = {
  monthTitleFontSize: AppFontSize.display,
  monthTitleLineHeight: AppLineHeight.display,
  transactionMinimumHeight: 160,
  calendarExpansionDurationMs: 260,
  calendarExpansionIconWidth: 18,
  calendarExpansionIconHeight: 7,
} as const;

export const MonthlySummaryUi = {
  contentGap: 6,
  labelFontSize: AppFontSize.caption,
  metricGap: 4,
  metricValueFontSize: AppFontSize.body,
  minimumRowWidth: 264,
  dateLabelFontSize: AppFontSize.caption,
  titleFontSize: AppFontSize.caption,
  verticalPadding: 4,
} as const;
