import { AdEventType, InterstitialAd } from "react-native-google-mobile-ads";

import {
  type AdInterstitialPlacementKey,
  AdMobInterstitialConfig,
  AdMobTestUnitIds,
} from "../../constants/ads";
import { appPlatform } from "../appPlatform";
import { logAppError, logAppWarning } from "../logAppError";
import { logAdMobLoadError } from "./adMobLoadError";

let interstitialAd: InterstitialAd | null = null;
let interstitialAdDisposers: Array<() => void> = [];
let isInterstitialLoaded = false;
let isInterstitialShowing = false;
let loadRetryTimer: ReturnType<typeof setTimeout> | null = null;

const INTERSTITIAL_LOAD_RETRY_DELAY_MS = 30_000;

export function preloadInterstitialAd() {
  const adUnitId = resolveInterstitialAdUnitId();
  if (!adUnitId) {
    return;
  }

  if (interstitialAd) {
    return;
  }

  clearInterstitialLoadRetry();
  interstitialAd = createInterstitialAd(adUnitId);
  interstitialAd.load();
}

export async function showInterstitialAd(placement: AdInterstitialPlacementKey): Promise<boolean> {
  if (!canShowInterstitialPlacement(placement)) {
    return false;
  }

  if (!interstitialAd) {
    preloadInterstitialAd();
  }

  if (!interstitialAd || !isInterstitialLoaded || isInterstitialShowing) {
    logAppWarning("AdMob", "Interstitial ad not ready", {
      isLoaded: isInterstitialLoaded,
      isShowing: isInterstitialShowing,
      placement,
      step: "show_interstitial_ad",
    });
    preloadInterstitialAd();
    return false;
  }

  try {
    const dismissPromise = waitForInterstitialDismissal(interstitialAd);
    await interstitialAd.show();
    await dismissPromise;
    return true;
  } catch (error) {
    logAppError("AdMob", error, {
      placement,
      step: "show_interstitial_ad",
    });
    rebuildInterstitialAd();
    return false;
  }
}

function canShowInterstitialPlacement(placement: AdInterstitialPlacementKey) {
  if (__DEV__) {
    return true;
  }

  return true;
}

function waitForInterstitialDismissal(currentInterstitialAd: InterstitialAd): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let hasSettled = false;

    const cleanup = () => {
      closeDisposer();
      errorDisposer();
    };

    const settle = (nextHandler: () => void) => {
      if (hasSettled) {
        return;
      }

      hasSettled = true;
      cleanup();
      nextHandler();
    };

    const closeDisposer = currentInterstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      settle(resolve);
    });

    const errorDisposer = currentInterstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
      settle(() => reject(error));
    });
  });
}

function createInterstitialAd(adUnitId: string) {
  const nextInterstitialAd = InterstitialAd.createForAdRequest(adUnitId);

  interstitialAdDisposers = [
    nextInterstitialAd.addAdEventListener(AdEventType.LOADED, () => {
      isInterstitialLoaded = true;
      clearInterstitialLoadRetry();
    }),
    nextInterstitialAd.addAdEventListener(AdEventType.OPENED, () => {
      isInterstitialShowing = true;
    }),
    nextInterstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      isInterstitialLoaded = false;
      isInterstitialShowing = false;
      rebuildInterstitialAd();
    }),
    nextInterstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
      isInterstitialLoaded = false;
      isInterstitialShowing = false;
      logAdMobLoadError("AdMob", error, {
        step: "load_interstitial_ad",
        unitId: adUnitId,
      });
      scheduleInterstitialAdRebuild();
    }),
  ];

  return nextInterstitialAd;
}

function rebuildInterstitialAd() {
  cleanupInterstitialAd();

  const adUnitId = resolveInterstitialAdUnitId();
  if (!adUnitId) {
    return;
  }

  interstitialAd = createInterstitialAd(adUnitId);
  interstitialAd.load();
}

function cleanupInterstitialAd() {
  for (const dispose of interstitialAdDisposers) {
    dispose();
  }

  interstitialAdDisposers = [];
  interstitialAd = null;
}

function scheduleInterstitialAdRebuild() {
  cleanupInterstitialAd();

  if (loadRetryTimer) {
    return;
  }

  loadRetryTimer = setTimeout(() => {
    loadRetryTimer = null;
    preloadInterstitialAd();
  }, INTERSTITIAL_LOAD_RETRY_DELAY_MS);
}

function clearInterstitialLoadRetry() {
  if (!loadRetryTimer) {
    return;
  }

  clearTimeout(loadRetryTimer);
  loadRetryTimer = null;
}

function resolveInterstitialAdUnitId() {
  if (__DEV__) {
    return appPlatform.isIOS
      ? AdMobTestUnitIds.iosInterstitial
      : AdMobTestUnitIds.androidInterstitial;
  }

  return appPlatform.isIOS
    ? AdMobInterstitialConfig.iosAdUnitId
    : AdMobInterstitialConfig.androidAdUnitId;
}
