export const AnnualReportCopy = {
  confirmTitle: "연간 보고서를 다운로드할까요?",
  downloadAction: "다운로드",
  headerAccessibilityLabel: "연간 보고서 다운로드",
  monthlyChartSheetName: "월별 차트",
  monthlyDetailSheetName: "월별 내역",
  yearlyChartSheetName: "연간 차트",
  yearlySummarySheetName: "연간 종합",
  errorMessage: "연간 보고서를 만들지 못했습니다.",
  successMessage: "연간 보고서를 준비했습니다.",
} as const;

export const AnnualReportUi = {
  chartBarCharacter: "■",
  chartBarLength: 12,
  fileNamePrefix: "moneychecks-yearly-report",
  headerIconSize: 14,
} as const;

export function buildAnnualReportConfirmMessage(year: number, bookName: string): string {
  return `${year}년 ${bookName} 연간 보고서를 다운로드합니다.`;
}
