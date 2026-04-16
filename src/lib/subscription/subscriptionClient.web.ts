import { type SubscriptionTier, SubscriptionTiers } from "../../constants/subscription";

type SubscriptionSnapshot = {
  hasAvailablePlusPackage: boolean;
  tier: SubscriptionTier;
};

export async function configureSubscriptionClient(_appUserId: string): Promise<void> {}

export async function loadSubscriptionSnapshot(): Promise<SubscriptionSnapshot> {
  return {
    hasAvailablePlusPackage: false,
    tier: SubscriptionTiers.free,
  };
}

export function addSubscriptionTierListener(
  _listener: (tier: SubscriptionTier) => void,
): () => void {
  return () => {};
}

export async function purchasePlusPackage(): Promise<SubscriptionSnapshot> {
  return loadSubscriptionSnapshot();
}

export async function restoreSubscriptionPurchases(): Promise<SubscriptionSnapshot> {
  return loadSubscriptionSnapshot();
}
