export const AnnualReportCopy = {
  confirmTitle: "보고서를 다운로드할까요?",
  customRangeOption: "기간 직접 선택",
  customRangeTitle: "기간을 선택해 주세요.",
  customRangeInvalidMessage: "시작 날짜가 종료 날짜보다 늦을 수 없습니다.",
  downloadAction: "다운로드",
  firstToLastOption: "최초 - 마지막 등록 날짜",
  headerAccessibilityLabel: "보고서 다운로드",
  monthlyChartSheetName: "월별 차트",
  monthlyDetailSheetName: "월별 기록",
  noEntriesMessage: "아직 거래가 없어 보고서를 만들 수 없습니다.",
  optionTitle: "보고서 범위를 선택해 주세요.",
  rangeEndLabel: "종료 날짜",
  rangeStartLabel: "시작 날짜",
  yearlyChartSheetName: "기간 차트",
  yearlySummarySheetName: "기간 종합",
  errorMessage: "보고서를 만들지 못했습니다.",
  successMessage: "보고서를 준비했습니다.",
} as const;

export type AnnualReportRangeMode = "custom-range" | "first-to-last" | "selected-year";

export const AnnualReportUi = {
  chartBarCharacter: "■",
  chartBarLength: 12,
  fileNameCustomRangeSuffix: "custom-range",
  fileNameFirstToLastSuffix: "first-to-last",
  fileNamePrefix: "moneychecks-report",
  fileNameSelectedYearSuffix: "selected-year",
  headerIconSize: 14,
} as const;

export function buildAnnualReportConfirmMessage(bookName: string): string {
  return `${bookName} 보고서를 다운로드합니다.`;
}

export function buildAnnualReportOptionDescription(
  mode: AnnualReportRangeMode,
  optionLabel: string,
  periodLabel: string,
): string {
  return `${optionLabel}\n${periodLabel}`;
}

export function buildSelectedYearOptionLabel(year: number): string {
  return `${year}년 한 해`;
}
