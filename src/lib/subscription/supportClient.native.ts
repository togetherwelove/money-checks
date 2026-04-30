import Purchases, { type PurchasesPackage } from "react-native-purchases";

import { SupportConfig, type SupportPackageIdentifier } from "../../constants/support";
import { getRevenueCatPublicApiKey } from "./revenueCatApiKey";
import { configureSubscriptionClient } from "./subscriptionClient";

export type SupportPackageSnapshot = {
  identifier: SupportPackageIdentifier;
  priceLabel: string | null;
};

type SupportSnapshot = {
  packages: SupportPackageSnapshot[];
};

let currentSupportPackages = new Map<SupportPackageIdentifier, PurchasesPackage>();

export async function loadSupportSnapshot(appUserId: string): Promise<SupportSnapshot> {
  if (!getRevenueCatPublicApiKey()) {
    return { packages: [] };
  }

  await configureSubscriptionClient(appUserId);
  const offerings = await Purchases.getOfferings();
  const supportOffering = offerings.all[SupportConfig.offeringIdentifier];
  const resolvedPackages = resolveSupportPackages(supportOffering?.availablePackages ?? []);

  currentSupportPackages = new Map(
    resolvedPackages.map((currentPackage) => [currentPackage.identifier, currentPackage.package]),
  );

  return {
    packages: resolvedPackages.map(({ identifier, package: currentPackage }) => ({
      identifier,
      priceLabel: currentPackage.product.priceString ?? null,
    })),
  };
}

export async function purchaseSupportPackage(
  appUserId: string,
  identifier: SupportPackageIdentifier,
): Promise<void> {
  if (!getRevenueCatPublicApiKey()) {
    throw new Error("RevenueCat is not configured.");
  }

  let packageToPurchase = currentSupportPackages.get(identifier) ?? null;

  if (!packageToPurchase) {
    await loadSupportSnapshot(appUserId);
    packageToPurchase = currentSupportPackages.get(identifier) ?? null;
  }

  if (!packageToPurchase) {
    throw new Error("Support package is not available.");
  }

  await Purchases.purchasePackage(packageToPurchase);
}

function resolveSupportPackages(
  availablePackages: PurchasesPackage[],
): { identifier: SupportPackageIdentifier; package: PurchasesPackage }[] {
  return Object.values(SupportConfig.packageIdentifiers)
    .map((targetIdentifier) => {
      const matchingPackage =
        availablePackages.find((currentPackage) =>
          matchesSupportPackageIdentifier(currentPackage, targetIdentifier),
        ) ?? null;

      if (!matchingPackage) {
        return null;
      }

      return {
        identifier: targetIdentifier,
        package: matchingPackage,
      };
    })
    .filter(isResolvedSupportPackage);
}

function matchesSupportPackageIdentifier(
  currentPackage: PurchasesPackage,
  targetIdentifier: SupportPackageIdentifier,
): boolean {
  const normalizedTargetIdentifier = targetIdentifier.toLowerCase();

  return (
    currentPackage.identifier.toLowerCase() === normalizedTargetIdentifier ||
    currentPackage.identifier.toLowerCase() === `$rc_${normalizedTargetIdentifier}` ||
    currentPackage.product.identifier.toLowerCase() === normalizedTargetIdentifier
  );
}

function isResolvedSupportPackage(
  currentValue: { identifier: SupportPackageIdentifier; package: PurchasesPackage } | null,
): currentValue is { identifier: SupportPackageIdentifier; package: PurchasesPackage } {
  return Boolean(currentValue);
}
