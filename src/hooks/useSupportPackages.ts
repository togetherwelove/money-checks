import { useEffect, useState } from "react";

import type { SupportPackageIdentifier } from "../constants/support";
import { logAppError } from "../lib/logAppError";
import {
  loadSupportSnapshot,
  purchaseSupportPackage,
  type SupportPackageSnapshot,
} from "../lib/subscription/supportClient";

type SupportPackagesState = {
  isLoading: boolean;
  packages: SupportPackageSnapshot[];
  purchasePackage: (identifier: SupportPackageIdentifier) => Promise<void>;
};

export function useSupportPackages(userId: string): SupportPackagesState {
  const [isLoading, setIsLoading] = useState(true);
  const [packages, setPackages] = useState<SupportPackageSnapshot[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadPackages = async () => {
      try {
        const nextSnapshot = await loadSupportSnapshot(userId);
        if (!isMounted) {
          return;
        }

        setPackages(nextSnapshot.packages);
      } catch (error) {
        if (isMounted) {
          setPackages([]);
        }
        logAppError("SupportPackages", error, {
          step: "load_support_packages",
          userId,
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadPackages();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return {
    isLoading,
    packages,
    purchasePackage: async (identifier) => {
      await purchaseSupportPackage(userId, identifier);
    },
  };
}
