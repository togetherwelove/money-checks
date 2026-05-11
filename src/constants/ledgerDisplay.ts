import { resolveStaticCopyLanguage, selectStaticCopy } from "../i18n/staticCopy";

const LEDGER_DISPLAY_LOCALE = resolveStaticCopyLanguage() === "en" ? "en-US" : "ko-KR";

export const DEFAULT_MEMBER_DISPLAY_NAME = selectStaticCopy({
  en: "User",
  ko: "사용자",
});
export const EMPTY_VALUE_PLACEHOLDER = "-";
export const EMPTY_CATEGORY_LABEL = EMPTY_VALUE_PLACEHOLDER;
export const SHARE_CODE_LENGTH = 16;

const monthLabelFormatter = new Intl.DateTimeFormat(LEDGER_DISPLAY_LOCALE, {
  month: "long",
});
const compactMonthLabelFormatter = new Intl.DateTimeFormat(LEDGER_DISPLAY_LOCALE, {
  month: "short",
});

export function formatMonthLabel(date: Date): string {
  return monthLabelFormatter.format(date);
}

export function formatCompactMonthLabel(date: Date): string {
  return compactMonthLabelFormatter.format(date);
}
