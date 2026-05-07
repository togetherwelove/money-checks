import { resolveStaticCopyLanguage } from "../i18n/staticCopy";

const AMOUNT_NUMBER_FORMAT_LOCALE = resolveStaticCopyLanguage() === "en" ? "en-US" : "ko-KR";
const amountNumberFormatter = new Intl.NumberFormat(AMOUNT_NUMBER_FORMAT_LOCALE);

export function sanitizeAmountDigits(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

export function formatAmountNumber(amount: number): string {
  return amountNumberFormatter.format(amount);
}

export function formatAmountInput(value: string): string {
  const digits = sanitizeAmountDigits(value);
  if (!digits) {
    return "";
  }

  return formatAmountNumber(Number(digits));
}
