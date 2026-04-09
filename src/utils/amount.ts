const amountNumberFormatter = new Intl.NumberFormat("ko-KR");

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
