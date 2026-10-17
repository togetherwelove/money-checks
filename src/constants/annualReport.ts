
export const AnnualReportCopy = {
    confirmTitle: "보고서를 다운로드할까요?",
    customRangeOption: "날짜 선택하기",
    customRangeTitle: "기간을 선택해 주세요.",
    customRangeInvalidMessage: "시작 날짜가 종료 날짜보다 늦을 수 없습니다.",
    downloadAction: "다운로드",
    firstToLastOption: "처음 등록일부터 마지막까지",
    headerAccessibilityLabel: "보고서 다운로드",
    authorSummarySheetName: "구성원별 집계",
    categorySummarySheetName: "분류별 집계",
    expenseCategorySheetName: "지출 분류별 집계",
    incomeCategorySheetName: "수입 분류별 집계",
    chartSheetName: "차트",
    ledgerSheetName: "원장",
    monthlySummarySheetName: "월별 집계",
    noEntriesMessage: "아직 거래가 없어 보고서를 만들 수 없습니다.",
    emptyPeriodMessage: "선택한 기간에 내역이 없습니다. 다른 기간을 선택해 주세요.",
    sharingUnavailableMessage: "이 기기에서는 파일 공유를 사용할 수 없습니다. 공유 기능을 사용할 수 있는 기기에서 다시 시도해 주세요.",
    incompleteDataMessage: "전체 내역을 확인하지 못했습니다. 다시 시도해 주세요.",
    previewTitle: "보고서 내용을 확인해 주세요.",
    cancelAction: "취소",
    installmentStatusHeader: "할부 상태",
    installmentStatuses: { prepaid: "선결제", proceeding: "진행 중", none: "해당 없음" },
    optionTitle: "보고서 범위를 선택해 주세요.",
    rangeEndLabel: "종료 날짜",
    rangeStartLabel: "시작 날짜",
    summarySheetName: "요약",
    errorMessage: "보고서를 만들지 못했습니다.",
    successMessage: "보고서를 준비했습니다.",
    chartTitleSuffix: "차트",
    confirmMessageSuffix: "보고서를 다운로드합니다.",
    selectedYearOptionSuffix: "년 한 해",
    ledgerHeaders: [
      "거래일",
      "연월",
      "유형",
      "내용",
      "분류",
      "수입",
      "지출",
      "잔액",
      "대상 구성원",
      "작성자",
      "메모",
      "증빙수",
      "분할",
      "등록일",
      "수정일",
      "거래ID",
      "할부 상태",
    ],
    monthlySummaryHeaders: ["월", "수입", "지출", "잔액", "건수"],
    expenseCategoryHeaders: ["지출 분류", "지출", "비중", "건수"],
    incomeCategoryHeaders: ["수입 분류", "수입", "비중", "건수"],
    memberSummaryHeaders: ["대상 구성원", "수입", "지출", "잔액", "건수"],
    summaryRows: {
      balance: "기간 잔액",
      entryCount: "기록 건수",
      expense: "총지출",
      generatedAt: "생성일",
      income: "총수입",
      ledger: "가계부",
      note: "안내",
      noteValue: "거래일 기준으로 집계한 자료이며, 잔액은 기간 수입에서 지출을 뺀 값입니다. 실제 계좌 잔고가 아닙니다. 할부 상태는 저장된 진행·선결제 상태이며 납부 여부를 날짜로 추정하지 않습니다. 엑셀 수정 시 집계는 자동 재계산되지 않습니다.",
      period: "기간",
      topExpenseCategory: "주요 지출 분류",
      topIncomeCategory: "주요 수입 분류",
    },
    typeLabels: {
      expense: "지출",
      income: "수입",
    },
    emptyCategoryLabels: {
      expense: "지출 없음",
      income: "수입 없음",
    },
    chartTitles: {
      expenseCategory: "지출 분류별 금액",
      incomeCategory: "수입 분류별 금액",
      member: "구성원별 수입과 지출",
      monthly: "월별 수입과 지출",
    },
  } as const;

export type AnnualReportRangeMode = "custom-range" | "first-to-last" | "selected-year";

export const AnnualReportQuery = { pageSize: 500 } as const;

export const AnnualReportUi = {
  rangeFieldBorderWidth: 1,
  rangeFieldGap: 8,
  headerIconSize: 14,
  rangeFieldPaddingHorizontal: 10,
  rangeFieldPaddingVertical: 8,
  rangePickerGap: 10,
} as const;

export function buildAnnualReportConfirmMessage(bookName: string): string {
  return `${bookName} ${AnnualReportCopy.confirmMessageSuffix}`;
}

export function buildAnnualReportOptionDescription(
  mode: AnnualReportRangeMode,
  optionLabel: string,
  periodLabel: string,
): string {
  return `${optionLabel}\n${periodLabel}`;
}

export function buildSelectedYearOptionLabel(year: number): string {
  return `${year}${AnnualReportCopy.selectedYearOptionSuffix}`;
}
