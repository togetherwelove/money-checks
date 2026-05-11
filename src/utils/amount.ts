import { formatCurrencyNumber } from "./currency";

export function sanitizeAmountDigits(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

export function formatAmountNumber(amount: number): string {
  return formatCurrencyNumber(amount);
}

export function formatAmountInput(value: string): string {
  const digits = sanitizeAmountDigits(value);
  if (!digits) {
    return "";
  }

  return formatAmountNumber(Number(digits));
}
