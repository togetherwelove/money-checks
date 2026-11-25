export const CalendarSummaryModes = {
  all: "all",
  monthly: "monthly",
  selectedMonth: "selected-month",
} as const;

export type CalendarSummaryMode = (typeof CalendarSummaryModes)[keyof typeof CalendarSummaryModes];

export const CalendarSummaryBaseDay = {
  unselected: 0,
  max: 31,
  min: 1,
} as const;

export const CalendarSummaryBaseDayOptions = Array.from(
  { length: CalendarSummaryBaseDay.max },
  (_, index) => {
    const value = index + CalendarSummaryBaseDay.min;
    return { label: `${value}일`, value };
  },
);

export const CalendarSummaryModeOptions: { label: string; value: CalendarSummaryMode }[] = [
  { label: "월별", value: CalendarSummaryModes.monthly },
  { label: "전체", value: CalendarSummaryModes.all },
  { label: "선택일 기준", value: CalendarSummaryModes.selectedMonth },
];

export const CalendarSummaryLoadingLabel = "...";

export const CalendarSummaryBalanceLabels = {
  [CalendarSummaryModes.monthly]: "이번달 차액",
  [CalendarSummaryModes.all]: "전체 차액",
  [CalendarSummaryModes.selectedMonth]: "선택 기간 차액",
} as const satisfies Record<CalendarSummaryMode, string>;

export function formatCalendarSummaryBalanceLabel(mode: CalendarSummaryMode, periodLabel: string) {
  if (
    mode === CalendarSummaryModes.selectedMonth &&
    periodLabel &&
    periodLabel !== CalendarSummaryLabels.selectedMonthPrompt
  ) {
    return `${periodLabel.replace(/\s*~\s*/g, "~")} 차액`;
  }
  return CalendarSummaryBalanceLabels[mode];
}

export const CalendarSummaryLabels = {
  all: "전체 기간",
  changePeriod: "집계 기간 변경",
  expense: "지출",
  income: "수입",
  monthly: "월간 요약",
  selectedMonthPrompt: "기준일을 선택하지 않았습니다",
} as const;

export function formatSelectedDateEntryCount(count: number): string {
  return `${count}건`;
}
