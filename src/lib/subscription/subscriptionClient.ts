import { SubscriptionTier, SubscriptionTiers } from "../../constants/subscription";

type SubscriptionSnapshot = {
  hasAvailablePlusPackage: boolean;
  plusPriceLabel: string | null;
  tier: SubscriptionTier;
};

export async function configureSubscriptionClient(appUserId: string): Promise<void> {
  // Stub for web/non-native
}

export async function signOutSubscriptionClient(): Promise<void> {
  // Stub for web/non-native
}

export async function loadSubscriptionSnapshot(): Promise<SubscriptionSnapshot> {
  return {
    hasAvailablePlusPackage: false,
    plusPriceLabel: null,
    tier: SubscriptionTiers.free,
  };
}

export function addSubscriptionTierListener(
  listener: (tier: SubscriptionTier) => void,
): () => void {
  return () => {};
}

export async function purchasePlusPackage(): Promise<SubscriptionSnapshot> {
  return loadSubscriptionSnapshot();
}

export async function restoreSubscriptionPurchases(): Promise<SubscriptionSnapshot> {
  return loadSubscriptionSnapshot();
}
