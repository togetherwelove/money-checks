import { useEffect, useState } from "react";

import { type SubscriptionTier, SubscriptionTiers } from "../constants/subscription";
import { logAppError } from "../lib/logAppError";
import {
  addSubscriptionTierListener,
  configureSubscriptionClient,
  loadSubscriptionSnapshot,
  purchasePlusPackage,
  restoreSubscriptionPurchases,
} from "../lib/subscription/subscriptionClient";
import { syncRevenueCatSubscriptionTier } from "../lib/subscription/syncRevenueCatSubscription";

type SubscriptionPlanState = {
  currentTier: SubscriptionTier;
  hasAvailablePlusPackage: boolean;
  isLoading: boolean;
  isPlusActive: boolean;
  plusPriceLabel: string | null;
  purchasePlus: () => Promise<SubscriptionTier>;
  restorePurchases: () => Promise<SubscriptionTier>;
};

export function useSubscriptionPlan(userId: string): SubscriptionPlanState {
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>(SubscriptionTiers.free);
  const [hasAvailablePlusPackage, setHasAvailablePlusPackage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [plusPriceLabel, setPlusPriceLabel] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSubscriptionPlan = async () => {
      try {
        await configureSubscriptionClient(userId);
        const nextSnapshot = await loadSubscriptionSnapshot();
        const syncedTier = await trySyncRevenueCatSubscriptionTier(userId);
        const nextTier = syncedTier ?? nextSnapshot.tier;
        if (!isMounted) {
          return;
        }

        setCurrentTier(nextTier);
        setHasAvailablePlusPackage(nextSnapshot.hasAvailablePlusPackage);
        setPlusPriceLabel(nextSnapshot.plusPriceLabel);
      } catch (error) {
        if (isMounted) {
          setCurrentTier(SubscriptionTiers.free);
          setHasAvailablePlusPackage(false);
          setPlusPriceLabel(null);
        }
        logAppError("SubscriptionPlan", error, {
          step: "load_subscription_plan",
          userId,
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadSubscriptionPlan();

    const removeListener = addSubscriptionTierListener((nextTier) => {
      if (!isMounted) {
        return;
      }

      setCurrentTier(nextTier);
    });

    return () => {
      isMounted = false;
      removeListener();
    };
  }, [userId]);

  return {
    currentTier,
    hasAvailablePlusPackage,
    isLoading,
    isPlusActive: currentTier === SubscriptionTiers.plus,
    plusPriceLabel,
    purchasePlus: async () => {
      await configureSubscriptionClient(userId);
      const nextSnapshot = await purchasePlusPackage();
      const syncedTier = await trySyncRevenueCatSubscriptionTier(userId);
      const nextTier = syncedTier ?? nextSnapshot.tier;
      setCurrentTier(nextTier);
      setHasAvailablePlusPackage(nextSnapshot.hasAvailablePlusPackage);
      setPlusPriceLabel(nextSnapshot.plusPriceLabel);
      return nextTier;
    },
    restorePurchases: async () => {
      await configureSubscriptionClient(userId);
      const nextSnapshot = await restoreSubscriptionPurchases();
      const syncedTier = await trySyncRevenueCatSubscriptionTier(userId);
      const nextTier = syncedTier ?? nextSnapshot.tier;
      setCurrentTier(nextTier);
      setHasAvailablePlusPackage(nextSnapshot.hasAvailablePlusPackage);
      setPlusPriceLabel(nextSnapshot.plusPriceLabel);
      return nextTier;
    },
  };
}

async function trySyncRevenueCatSubscriptionTier(userId: string): Promise<SubscriptionTier | null> {
  try {
    return await syncRevenueCatSubscriptionTier();
  } catch (error) {
    logAppError("SubscriptionPlan", error, {
      step: "sync_revenuecat_subscription_tier",
      userId,
    });
    return null;
  }
}
