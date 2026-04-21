import Purchases, { type CustomerInfo, type PurchasesPackage } from "react-native-purchases";

import {
  RevenueCatConfig,
  SubscriptionConfig,
  type SubscriptionTier,
  SubscriptionTiers,
} from "../../constants/subscription";
import { formatSubscriptionPriceLabel } from "./formatSubscriptionPriceLabel";
import { logAppWarning } from "../logAppError";

type SubscriptionSnapshot = {
  hasAvailablePlusPackage: boolean;
  plusPriceLabel: string | null;
  tier: SubscriptionTier;
};

let configuredAppUserId: string | null = null;
let currentPlusPackage: PurchasesPackage | null = null;
let hasConfiguredRevenueCatLogHandler = false;

export async function configureSubscriptionClient(appUserId: string): Promise<void> {
  if (!RevenueCatConfig.publicApiKey) {
    return;
  }

  configureRevenueCatLogHandler();

  if (configuredAppUserId === null) {
    Purchases.configure({ apiKey: RevenueCatConfig.publicApiKey, appUserID: appUserId });
    configuredAppUserId = appUserId;
    return;
  }

  if (configuredAppUserId !== appUserId) {
    await Purchases.logIn(appUserId);
    configuredAppUserId = appUserId;
  }
}

export async function loadSubscriptionSnapshot(): Promise<SubscriptionSnapshot> {
  if (!RevenueCatConfig.publicApiKey) {
    return {
      hasAvailablePlusPackage: false,
      plusPriceLabel: null,
      tier: SubscriptionTiers.free,
    };
  }

  currentPlusPackage = await loadCurrentPlusPackage();
  const customerInfo = await Purchases.getCustomerInfo();

  return {
    hasAvailablePlusPackage: Boolean(currentPlusPackage),
    plusPriceLabel: formatSubscriptionPriceLabel(currentPlusPackage?.product.priceString ?? null),
    tier: resolveSubscriptionTier(customerInfo),
  };
}

export function addSubscriptionTierListener(
  listener: (tier: SubscriptionTier) => void,
): () => void {
  const handleCustomerInfoUpdate = (customerInfo: CustomerInfo) => {
    listener(resolveSubscriptionTier(customerInfo));
  };

  Purchases.addCustomerInfoUpdateListener(handleCustomerInfoUpdate);

  return () => {
    Purchases.removeCustomerInfoUpdateListener(handleCustomerInfoUpdate);
  };
}

export async function purchasePlusPackage(): Promise<SubscriptionSnapshot> {
  if (!currentPlusPackage) {
    const nextSnapshot = await loadSubscriptionSnapshot();
    if (!nextSnapshot.hasAvailablePlusPackage || !currentPlusPackage) {
      throw new Error("Plus package is not available.");
    }
  }

  await Purchases.purchasePackage(currentPlusPackage);
  return loadSubscriptionSnapshot();
}

export async function restoreSubscriptionPurchases(): Promise<SubscriptionSnapshot> {
  await Purchases.restorePurchases();
  return loadSubscriptionSnapshot();
}

async function loadCurrentPlusPackage(): Promise<PurchasesPackage | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return resolvePlusPackage(offerings.current?.availablePackages ?? []);
  } catch (error) {
    logAppWarning("SubscriptionPlan", "Unable to load subscription offerings.", {
      step: "load_subscription_offerings",
      error,
    });
    return null;
  }
}

function resolvePlusPackage(availablePackages: PurchasesPackage[]): PurchasesPackage | null {
  const normalizedMonthlyIdentifier = SubscriptionConfig.monthlyPackageIdentifier.toLowerCase();

  return (
    availablePackages.find(
      (currentPackage) =>
        currentPackage.identifier.toLowerCase() === normalizedMonthlyIdentifier ||
        currentPackage.identifier.toLowerCase() === `$rc_${normalizedMonthlyIdentifier}` ||
        currentPackage.product.identifier.toLowerCase() === normalizedMonthlyIdentifier,
    ) ?? null
  );
}

function resolveSubscriptionTier(customerInfo: CustomerInfo): SubscriptionTier {
  return customerInfo.entitlements.active[SubscriptionConfig.plusEntitlementId]
    ? SubscriptionTiers.plus
    : SubscriptionTiers.free;
}

function configureRevenueCatLogHandler() {
  if (hasConfiguredRevenueCatLogHandler) {
    return;
  }

  const purchasesWithLogHandler = Purchases as typeof Purchases & {
    setLogHandler?: (handler: (logLevel: string, message: string) => void) => void;
  };

  purchasesWithLogHandler.setLogHandler?.((logLevel, message) => {
    if (isRevenueCatPurchaseCancelledMessage(message)) {
      return;
    }

    if (logLevel === "ERROR") {
      console.error(`[RevenueCat] ${message}`);
      return;
    }

    if (logLevel === "WARN") {
      console.warn(`[RevenueCat] ${message}`);
    }
  });

  hasConfiguredRevenueCatLogHandler = true;
}

function isRevenueCatPurchaseCancelledMessage(message: string): boolean {
  return message.toLowerCase().includes("purchase was cancelled");
}
