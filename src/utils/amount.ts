import { type AppCurrency, CurrencyFormatConfig } from "../constants/currency";
import { resolveDisplayCurrency } from "../lib/currencyPreference";
import { formatCurrencyNumber } from "./currency";

const AMOUNT_DECIMAL_SEPARATOR = ".";

export type AmountInputSelection = {
  end: number;
  start: number;
};

export function sanitizeAmountDigits(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

export function sanitizeAmountValue(value: string, currency = resolveDisplayCurrency()): string {
  if (CurrencyFormatConfig[currency].maximumFractionDigits <= 0) {
    return sanitizeAmountDigits(value);
  }

  return sanitizeDecimalAmountValue(value, CurrencyFormatConfig[currency].maximumFractionDigits);
}

export function formatAmountNumber(amount: number, currency = resolveDisplayCurrency()): string {
  return formatCurrencyNumber(amount, currency);
}

export function formatAmountInput(value: string, currency = resolveDisplayCurrency()): string {
  const sanitizedValue = sanitizeAmountValue(value, currency);
  if (!sanitizedValue) {
    return "";
  }

  if (CurrencyFormatConfig[currency].maximumFractionDigits <= 0) {
    return formatAmountNumber(Number(sanitizedValue), currency);
  }

  return formatDecimalAmountInput(sanitizedValue, currency);
}

export function resolveFormattedAmountInputSelection({
  currency = resolveDisplayCurrency(),
  nextDisplayValue,
  previousDisplayValue,
  previousSelection,
}: {
  currency?: AppCurrency;
  nextDisplayValue: string;
  previousDisplayValue: string;
  previousSelection: AmountInputSelection;
}): AmountInputSelection {
  const previousRawValue = sanitizeAmountValue(previousDisplayValue, currency);
  const nextRawValue = sanitizeAmountValue(nextDisplayValue, currency);
  const nextFormattedValue = formatAmountInput(nextRawValue, currency);
  const previousRawSelectionStart = countSanitizedAmountCharsBeforeCursor(
    previousDisplayValue,
    previousSelection.start,
    currency,
  );
  const previousRawSelectionEnd = countSanitizedAmountCharsBeforeCursor(
    previousDisplayValue,
    previousSelection.end,
    currency,
  );
  const selectedRawCharCount = Math.max(0, previousRawSelectionEnd - previousRawSelectionStart);
  const rawLengthDelta = nextRawValue.length - previousRawValue.length;
  const nextRawCursorIndex =
    selectedRawCharCount > 0
      ? previousRawSelectionStart + Math.max(0, rawLengthDelta + selectedRawCharCount)
      : rawLengthDelta !== 0
        ? previousRawSelectionStart + rawLengthDelta
        : countSanitizedAmountCharsBeforeCursor(
            nextDisplayValue,
            resolveEditedDisplayCursor(previousDisplayValue, nextDisplayValue),
            currency,
          );
  const nextCursorIndex = resolveFormattedCursorIndex(
    nextFormattedValue,
    Math.max(0, Math.min(nextRawCursorIndex, nextRawValue.length)),
  );

  return {
    end: nextCursorIndex,
    start: nextCursorIndex,
  };
}

function sanitizeDecimalAmountValue(value: string, maxFractionDigits: number): string {
  const normalizedValue = value.replaceAll(",", "").replace(/[^0-9.]/g, "");
  const decimalIndex = normalizedValue.indexOf(AMOUNT_DECIMAL_SEPARATOR);
  if (decimalIndex === -1) {
    return sanitizeAmountDigits(normalizedValue);
  }

  const integerPart = sanitizeAmountDigits(normalizedValue.slice(0, decimalIndex));
  const fractionPart = sanitizeAmountDigits(normalizedValue.slice(decimalIndex + 1)).slice(
    0,
    maxFractionDigits,
  );

  return `${integerPart || "0"}${AMOUNT_DECIMAL_SEPARATOR}${fractionPart}`;
}

function formatDecimalAmountInput(value: string, currency: AppCurrency): string {
  const [integerPart = "0", fractionPart] = value.split(AMOUNT_DECIMAL_SEPARATOR);
  const formattedInteger = formatAmountNumber(Number(integerPart || "0"), currency);
  if (fractionPart === undefined) {
    return formattedInteger;
  }

  return `${formattedInteger}${AMOUNT_DECIMAL_SEPARATOR}${fractionPart}`;
}

function countSanitizedAmountCharsBeforeCursor(
  value: string,
  cursorIndex: number,
  currency: AppCurrency,
): number {
  const boundedCursorIndex = Math.max(0, Math.min(cursorIndex, value.length));
  const sanitizedPrefix = sanitizeAmountValue(value.slice(0, boundedCursorIndex), currency);
  const sanitizedValue = sanitizeAmountValue(value, currency);

  return Math.min(sanitizedPrefix.length, sanitizedValue.length);
}

function resolveEditedDisplayCursor(
  previousDisplayValue: string,
  nextDisplayValue: string,
): number {
  const sharedPrefixLength = countSharedPrefixLength(previousDisplayValue, nextDisplayValue);
  const sharedSuffixLength = countSharedSuffixLength(
    previousDisplayValue,
    nextDisplayValue,
    sharedPrefixLength,
  );

  return nextDisplayValue.length - sharedSuffixLength;
}

function countSharedPrefixLength(previousValue: string, nextValue: string): number {
  const maxPrefixLength = Math.min(previousValue.length, nextValue.length);
  let prefixLength = 0;

  while (
    prefixLength < maxPrefixLength &&
    previousValue[prefixLength] === nextValue[prefixLength]
  ) {
    prefixLength += 1;
  }

  return prefixLength;
}

function countSharedSuffixLength(
  previousValue: string,
  nextValue: string,
  sharedPrefixLength: number,
): number {
  const maxSuffixLength = Math.min(previousValue.length, nextValue.length) - sharedPrefixLength;
  let suffixLength = 0;

  while (
    suffixLength < maxSuffixLength &&
    previousValue[previousValue.length - suffixLength - 1] ===
      nextValue[nextValue.length - suffixLength - 1]
  ) {
    suffixLength += 1;
  }

  return suffixLength;
}

function resolveFormattedCursorIndex(formattedValue: string, rawCursorIndex: number): number {
  if (rawCursorIndex <= 0) {
    return 0;
  }

  let rawCharCount = 0;
  for (let index = 0; index < formattedValue.length; index += 1) {
    if (isAmountInputRawChar(formattedValue[index])) {
      rawCharCount += 1;
    }

    if (rawCharCount >= rawCursorIndex) {
      return index + 1;
    }
  }

  return formattedValue.length;
}

function isAmountInputRawChar(char: string | undefined): boolean {
  return Boolean(char && (/[0-9]/.test(char) || char === AMOUNT_DECIMAL_SEPARATOR));
}
