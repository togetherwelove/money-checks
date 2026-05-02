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
        if (!isMounted) {
          return;
        }

        setCurrentTier(nextSnapshot.tier);
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
      setCurrentTier(nextSnapshot.tier);
      setHasAvailablePlusPackage(nextSnapshot.hasAvailablePlusPackage);
      setPlusPriceLabel(nextSnapshot.plusPriceLabel);
      return nextSnapshot.tier;
    },
    restorePurchases: async () => {
      await configureSubscriptionClient(userId);
      const nextSnapshot = await restoreSubscriptionPurchases();
      setCurrentTier(nextSnapshot.tier);
      setHasAvailablePlusPackage(nextSnapshot.hasAvailablePlusPackage);
      setPlusPriceLabel(nextSnapshot.plusPriceLabel);
      return nextSnapshot.tier;
    },
  };
}
