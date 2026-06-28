
export const NotificationThresholdAmountInput = {
  characterWidth: 9,
  horizontalPadding: 4,
  inputWidth: 70,
  maxAmount: 9_999_999,
  maxFormattedLength: "9,999,999".length,
  minInputWidth: 28,
  periodLabelWidth: 44,
} as const;

export function clampNotificationThresholdAmount(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  return Math.min(Math.trunc(amount), NotificationThresholdAmountInput.maxAmount);
}
