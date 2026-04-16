import { useCallback, useEffect, useRef, useState } from "react";

import { type SubscriptionTier, SubscriptionTiers } from "../constants/subscription";
import { logAppError } from "../lib/logAppError";
import { updateOwnSubscriptionTier } from "../lib/profiles";
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
  purchasePlus: () => Promise<SubscriptionTier>;
  restorePurchases: () => Promise<SubscriptionTier>;
};

export function useSubscriptionPlan(userId: string): SubscriptionPlanState {
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>(SubscriptionTiers.free);
  const [hasAvailablePlusPackage, setHasAvailablePlusPackage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const lastSyncedTierRef = useRef<SubscriptionTier | null>(null);
  const syncProfileTier = useCallback(
    async (nextTier: SubscriptionTier) => {
      if (lastSyncedTierRef.current === nextTier) {
        return;
      }

      try {
        await updateOwnSubscriptionTier(userId, nextTier);
        lastSyncedTierRef.current = nextTier;
      } catch (error) {
        logAppError("SubscriptionPlan", error, {
          nextTier,
          step: "sync_subscription_tier",
          userId,
        });
      }
    },
    [userId],
  );

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
        void syncProfileTier(nextSnapshot.tier);
      } catch (error) {
        if (isMounted) {
          setCurrentTier(SubscriptionTiers.free);
          setHasAvailablePlusPackage(false);
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
      void syncProfileTier(nextTier);
    });

    return () => {
      isMounted = false;
      removeListener();
    };
  }, [syncProfileTier, userId]);

  return {
    currentTier,
    hasAvailablePlusPackage,
    isLoading,
    isPlusActive: currentTier === SubscriptionTiers.plus,
    purchasePlus: async () => {
      await configureSubscriptionClient(userId);
      const nextSnapshot = await purchasePlusPackage();
      setCurrentTier(nextSnapshot.tier);
      setHasAvailablePlusPackage(nextSnapshot.hasAvailablePlusPackage);
      void syncProfileTier(nextSnapshot.tier);
      return nextSnapshot.tier;
    },
    restorePurchases: async () => {
      await configureSubscriptionClient(userId);
      const nextSnapshot = await restoreSubscriptionPurchases();
      setCurrentTier(nextSnapshot.tier);
      setHasAvailablePlusPackage(nextSnapshot.hasAvailablePlusPackage);
      void syncProfileTier(nextSnapshot.tier);
      return nextSnapshot.tier;
    },
  };
}
