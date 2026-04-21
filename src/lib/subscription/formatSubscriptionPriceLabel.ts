import { SubscriptionMessages } from "../../constants/subscription";

export function formatSubscriptionPriceLabel(priceLabel: string | null): string | null {
  if (!priceLabel) {
    return null;
  }

  return `${priceLabel}${SubscriptionMessages.monthlyPriceSuffix}`;
}
