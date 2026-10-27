import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import { applyAdTrackingPermissionToAdRequests } from "../lib/ads/adRequestOptions";
import { preloadInterstitialAd } from "../lib/ads/interstitialAd";
import { ensureMobileAdsInitialized } from "../lib/ads/mobileAds";
import { preloadRewardedInterstitialAd } from "../lib/ads/rewardedInterstitialAd";
import {
  type AdTrackingPermissionState,
  isAdTrackingPermissionSupported,
  openAdTrackingSettings,
  readAdTrackingPermissionState,
  requestAdTrackingPermission,
  requestAdTrackingPermissionIfNeeded,
} from "../lib/ads/trackingTransparency";
import { logAppError } from "../lib/logAppError";

export function useAppAds(shouldServeAdMobAds: boolean, isSubscriptionLoading: boolean) {
  const [adTrackingPermissionState, setAdTrackingPermissionState] =
    useState<AdTrackingPermissionState>("unavailable");
  const [hasSettledInitialAdTrackingPermission, setHasSettledInitialAdTrackingPermission] =
    useState(false);
  const [isMobileAdsReady, setIsMobileAdsReady] = useState(false);
  const showsAdMobAds = shouldServeAdMobAds && isMobileAdsReady;
  const showAdTrackingPermissionCard =
    shouldServeAdMobAds &&
    isAdTrackingPermissionSupported() &&
    (adTrackingPermissionState === "not-determined" || adTrackingPermissionState === "denied");
  useEffect(() => {
    if (!isAdTrackingPermissionSupported()) {
      return;
    }

    const syncAdTrackingPermissionState = () => {
      void readAdTrackingPermissionState()
        .then((nextPermissionState) => {
          setAdTrackingPermissionState(nextPermissionState);
          applyAdTrackingPermissionToAdRequests(nextPermissionState);
        })
        .catch((error) => {
          logAppError("App", error, {
            step: "read_ad_tracking_permission_state",
          });
        });
    };

    syncAdTrackingPermissionState();

    const appStateSubscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        syncAdTrackingPermissionState();
      }
    });

    return () => {
      appStateSubscription.remove();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (isSubscriptionLoading) {
      setIsMobileAdsReady(false);
      setHasSettledInitialAdTrackingPermission(false);
      return () => {
        isMounted = false;
      };
    }

    if (!shouldServeAdMobAds) {
      setIsMobileAdsReady(false);
      setHasSettledInitialAdTrackingPermission(true);
      return () => {
        isMounted = false;
      };
    }

    setIsMobileAdsReady(false);
    setHasSettledInitialAdTrackingPermission(false);

    void requestAdTrackingPermissionIfNeeded()
      .then(async (nextPermissionState) => {
        applyAdTrackingPermissionToAdRequests(nextPermissionState);
        if (isMounted) {
          setAdTrackingPermissionState(nextPermissionState);
          setHasSettledInitialAdTrackingPermission(true);
        }

        await ensureMobileAdsInitialized();

        if (isMounted) {
          setIsMobileAdsReady(true);
          preloadInterstitialAd();
          preloadRewardedInterstitialAd();
        }
      })
      .catch((error) => {
        logAppError("App", error, {
          step: "initialize_mobile_ads_with_tracking_permission",
        });
        if (isMounted) {
          setHasSettledInitialAdTrackingPermission(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [shouldServeAdMobAds, isSubscriptionLoading]);

  const handleRequestAdTrackingPermission = useCallback(() => {
    void requestAdTrackingPermission()
      .then((nextPermissionState) => {
        setAdTrackingPermissionState(nextPermissionState);
        applyAdTrackingPermissionToAdRequests(nextPermissionState);
      })
      .catch((error) => {
        logAppError("App", error, {
          step: "request_ad_tracking_permission",
        });
      });
  }, []);

  const handleOpenAdTrackingSettings = useCallback(() => {
    void openAdTrackingSettings().catch((error) => {
      logAppError("App", error, {
        step: "open_ad_tracking_settings",
      });
    });
  }, []);

  return {
    adTrackingPermissionState,
    hasSettledInitialAdTrackingPermission,
    isMobileAdsReady,
    showsAdMobAds,
    showAdTrackingPermissionCard,
    handleRequestAdTrackingPermission,
    handleOpenAdTrackingSettings,
  };
}
