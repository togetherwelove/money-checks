import { MAX_INSTALLMENT_MONTHS } from "../lib/installments";

export const InstallmentPickerConfig = {
  presetMaxMonths: 6,
  customValue: "custom",
  customMinMonths: 7,
} as const;

export const InstallmentPickerCopy = {
  customLabel: "직접 입력",
  customAccessibilityLabel: "할부 개월 수",
  customHint: `${InstallmentPickerConfig.customMinMonths}~${MAX_INSTALLMENT_MONTHS}개월을 입력해 주세요.`,
  confirm: "확인",
} as const;
