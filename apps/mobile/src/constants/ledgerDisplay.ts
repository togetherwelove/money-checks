export const DEFAULT_MEMBER_DISPLAY_NAME = "사용자";
export const EMPTY_VALUE_PLACEHOLDER = "-";
export const EMPTY_CATEGORY_LABEL = EMPTY_VALUE_PLACEHOLDER;
export const KRW_CURRENCY_SUFFIX = "원";
export const SHARE_CODE_LENGTH = 16;

const monthLabelFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
});

export function formatMonthLabel(date: Date): string {
  return monthLabelFormatter.format(date);
}
