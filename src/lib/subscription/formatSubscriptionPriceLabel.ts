import { SubscriptionPeriodLabels } from "../../constants/subscriptionPeriods";

export function formatSubscriptionPriceLabel(
  priceLabel: string | null,
  subscriptionPeriod: string | null,
): string | null {
  if (!priceLabel) {
    return null;
  }

  if (!subscriptionPeriod) {
    return priceLabel;
  }

  const periodLabel =
    SubscriptionPeriodLabels[
      subscriptionPeriod as keyof typeof SubscriptionPeriodLabels
    ];

  return periodLabel ? `${priceLabel}${periodLabel}` : priceLabel;
}
