
export const EntryRegistrationCopy = {
  amountClearAccessibilityLabel: "금액 지우기",
  amountRequiredError: "금액을 입력해 주세요.",
  categoryLabel: "분류",
  categoryRequiredError: "분류를 선택해 주세요.",
  contentLabel: "내용",
  contentClearAccessibilityLabel: "내용 지우기",
  contentPlaceholder: "내용 입력",
  contentRequiredError: "내용을 입력해 주세요.",
  datePickerAccessibilityLabel: "내역 날짜 선택",
  datePickerConfirmAction: "확인",
  datePickerTitle: "날짜 선택",
  dailyFirstEntryAdNoticeMessage: "매일 첫 등록 시 한 번만 진행됩니다.",
  dailyFirstEntryAdNoticeTitle: "저장 전 광고가 표시됩니다",
  dailyFirstEntryAdUnavailableError: "광고를 불러오지 못했어요. 잠시 후 다시 등록해 주세요.",
  dailyFirstEntryRewardRequiredError: "광고 시청을 완료해 주세요. (매일 최초 1회)",
  dismissAccessibilityLabel: "등록 화면 닫기",
  discardChangesCancelAction: "계속 작성",
  discardChangesConfirmAction: "폐기",
  discardChangesMessage: "입력한 내용은 저장되지 않아요.",
  discardChangesTitle: "작성 중인 내역을 폐기할까요?",
  installmentPickerTitle: "할부 선택",
  installmentPrepaymentAction: "남은 할부금 즉시 상환",
  installmentPrepaymentConfirmAction: "즉시 상환",
  installmentPrepaymentError: "남은 할부금을 즉시 상환하지 못했어요.",
  installmentPrepaymentSuccess: "남은 할부금을 즉시 상환했어요.",
  installmentPrepaymentUnavailable: "즉시 상환할 미래 할부 내역이 없어요.",
  noteLabel: "메모",
  notePlaceholder: "메모 입력",
  paymentMethodAccessibilityLabel: "결제 방식 선택",
  paymentMethodLabel: "결제 방식",
  saveCreateSuccess: "내역을 등록했어요.",
  saveError: "기록 저장에 실패했어요.",
  saveMigrationError: "DB 마이그레이션 적용이 필요해요.",
  saveUpdateSuccess: "내역을 수정했어요.",
  targetMemberLabel: "대상 구성원",
} as const;

export function buildInstallmentPrepaymentConfirmMessage(
  installmentCount: number,
  formattedAmount: string,
): string {
  return `남은 할부 잔액 총 ${installmentCount}건(${formattedAmount})을 오늘 날짜로 즉시 상환 처리하시겠습니까? 예정된 미래의 할부 내역은 오늘 날짜의 지출로 합산됩니다.`;
}

export const EntryDateSelectorUi = {
  iconSize: 18,
  pressedOpacity: 0.7,
} as const;

export const EntryInstallmentSelectorUi = {
  iconSize: 16,
  pressedOpacity: 0.7,
} as const;

export const EntryNativeSheetUi = {
  detentRatio: 0.92,
  grabberHeight: 4,
  grabberTopMargin: 10,
  grabberWidth: 36,
  topRadius: 20,
} as const;

export const EntryTypeToggleUi = {
  containerHeight: 32,
  indicatorHeight: 2,
  labelFontSize: 14,
  labelLineHeight: 20,
  labelMarginHorizontal: 4,
  optionMinWidth: 48,
  optionPaddingHorizontal: 10,
} as const;
