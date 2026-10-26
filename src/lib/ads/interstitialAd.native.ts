import { AdEventType, InterstitialAd, TestIds } from "react-native-google-mobile-ads";

import { type AdInterstitialPlacementKey, AdMobInterstitialConfig, InterstitialAdTiming } from "../../constants/ads";
import { logAppError, logAppWarning } from "../logAppError";
import { resolveAdMobAdUnitId } from "./adUnitId";
import { logAdMobLoadError } from "./adMobLoadError";
import { getAdRequestOptions } from "./adRequestOptions";
import { waitForInterstitialLoad } from "./waitForInterstitialLoad.native";

let interstitialAd: InterstitialAd | null = null;
let interstitialAdDisposers: Array<() => void> = [];
let isInterstitialLoaded = false;
let isInterstitialShowing = false;
let isPresentationPending = false;
let loadRetryTimer: ReturnType<typeof setTimeout> | null = null;

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

export async function showInterstitialAd(
  placement: AdInterstitialPlacementKey,
  { waitForLoad = false }: { waitForLoad?: boolean } = {},
): Promise<boolean> {
  if (isPresentationPending || isInterstitialShowing) return false;
  isPresentationPending = true;
  try {
    if (!interstitialAd) preloadInterstitialAd();
    if (waitForLoad && interstitialAd && !isInterstitialLoaded) {
      await waitForInterstitialLoad(interstitialAd);
    }
    if (!interstitialAd || !isInterstitialLoaded) {
      logAppWarning("AdMob", "Interstitial ad not ready", {
        isLoaded: isInterstitialLoaded, placement, step: "show_interstitial_ad",
      });
      return false;
    }
    const dismissal = waitForInterstitialDismissal(interstitialAd);
    try {
      await interstitialAd.show();
      return await dismissal.promise;
    } finally {
      dismissal.cancel();
    }
  } catch (error) {
    logAppError("AdMob", error, {
      placement,
      step: "show_interstitial_ad",
    });
    rebuildInterstitialAd();
    return false;
  } finally {
    isPresentationPending = false;
  }
}

function waitForInterstitialDismissal(currentInterstitialAd: InterstitialAd) {
  let finish: (closed: boolean) => void = () => {};
  const promise = new Promise<boolean>(resolve => {
    finish = (closed) => {
      closeDisposer();
      errorDisposer();
      resolve(closed);
    };
    const closeDisposer = currentInterstitialAd.addAdEventListener(AdEventType.CLOSED, () => finish(true));
    const errorDisposer = currentInterstitialAd.addAdEventListener(AdEventType.ERROR, () => finish(false));
  });
  return { promise, cancel: () => finish(false) };
}

function createInterstitialAd(adUnitId: string) {
  const nextInterstitialAd = InterstitialAd.createForAdRequest(adUnitId, getAdRequestOptions());

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
  isInterstitialLoaded = false;
  isInterstitialShowing = false;
}

function scheduleInterstitialAdRebuild() {
  cleanupInterstitialAd();

  if (loadRetryTimer) {
    return;
  }

  loadRetryTimer = setTimeout(() => {
    loadRetryTimer = null;
    preloadInterstitialAd();
  }, InterstitialAdTiming.loadRetryDelayMs);
}

function clearInterstitialLoadRetry() {
  if (!loadRetryTimer) {
    return;
  }

  clearTimeout(loadRetryTimer);
  loadRetryTimer = null;
}

function resolveInterstitialAdUnitId() {
  return resolveAdMobAdUnitId(AdMobInterstitialConfig, TestIds.INTERSTITIAL);
}
