export const CalendarSummaryModes = {
  all: "all",
  monthly: "monthly",
  selectedMonth: "selected-month",
} as const;

export type CalendarSummaryMode =
  (typeof CalendarSummaryModes)[keyof typeof CalendarSummaryModes];

export const CalendarSummaryBaseDay = {
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

export const CalendarSummaryLabels = {
  all: "전체 기간",
  balance: "잔액",
  changePeriod: "집계 기간 변경",
  loadingCount: "불러오는 중",
  expense: "지출",
  income: "수입",
  monthly: "월간 요약",
  selectedMonthPrompt: "기준일을 선택하지 않았습니다",
} as const;

export function formatSelectedDateEntryCount(count: number | null): string {
  return count === null ? CalendarSummaryLabels.loadingCount : `${count}건`;
}
