import { Platform } from "react-native";
import {
  AdEventType,
  RewardedAdEventType,
  RewardedInterstitialAd,
  TestIds,
} from "react-native-google-mobile-ads";

import { AdMobRewardedInterstitialConfig } from "../../constants/ads";
import { logAppError, logAppWarning } from "../logAppError";
import { resolveAdMobAdUnitId } from "./adUnitId";
import { logAdMobLoadError } from "./adMobLoadError";
import { getAdRequestOptions } from "./adRequestOptions";

let rewardedInterstitialAd: RewardedInterstitialAd | null = null;
let rewardedInterstitialAdDisposers: Array<() => void> = [];
let isRewardedInterstitialLoaded = false;
let isRewardedInterstitialShowing = false;
let loadRetryTimer: ReturnType<typeof setTimeout> | null = null;
let rewardedInterstitialOpenedAtMs: number | null = null;
let hasRewardedInterstitialEarnedReward = false;
let rewardedInterstitialShowAttemptStartedAtMs: number | null = null;
let hasLoggedMissingRewardedInterstitialAdUnitId = false;

const REWARDED_INTERSTITIAL_LOAD_RETRY_DELAY_MS = 30_000;
const REWARDED_INTERSTITIAL_SHORT_CLOSE_THRESHOLD_MS = 1_500;
const REWARDED_INTERSTITIAL_RESULT_TIMEOUT_MS = 120_000;

type RewardedInterstitialShowResult =
  | {
      didEarnReward: boolean;
      type: "result";
    }
  | {
      type: "shown";
    }
  | {
      error: unknown;
      type: "show-error";
    };

export function preloadRewardedInterstitialAd() {
  const adUnitId = resolveRewardedInterstitialAdUnitId();
  if (!adUnitId) {
    logMissingRewardedInterstitialAdUnitId();
    return;
  }

  if (rewardedInterstitialAd) {
    return;
  }

  clearRewardedInterstitialLoadRetry();
  rewardedInterstitialAd = createRewardedInterstitialAd(adUnitId);
  rewardedInterstitialAd.load();
}

export function isRewardedInterstitialAdReady() {
  return Boolean(
    rewardedInterstitialAd && isRewardedInterstitialLoaded && !isRewardedInterstitialShowing,
  );
}

export async function showRewardedInterstitialAd(): Promise<boolean> {
  if (!rewardedInterstitialAd) {
    preloadRewardedInterstitialAd();
  }

  if (!rewardedInterstitialAd || !isRewardedInterstitialLoaded || isRewardedInterstitialShowing) {
    logAppWarning("AdMob", "Rewarded interstitial ad not ready", {
      isLoaded: isRewardedInterstitialLoaded,
      isShowing: isRewardedInterstitialShowing,
      step: "show_rewarded_interstitial_ad",
    });
    preloadRewardedInterstitialAd();
    return false;
  }

  try {
    rewardedInterstitialShowAttemptStartedAtMs = Date.now();
    logRewardedInterstitialTrace("show_requested");
    const rewardPromise = waitForRewardedInterstitialResult(rewardedInterstitialAd);
    const showPromise = rewardedInterstitialAd.show();
    const firstResult = await Promise.race<RewardedInterstitialShowResult>([
      rewardPromise.then((didEarnReward) => ({
        didEarnReward,
        type: "result",
      })),
      showPromise.then(
        () => ({
          type: "shown",
        }),
        (error) => ({
          error,
          type: "show-error",
        }),
      ),
    ]);

    if (firstResult.type === "show-error") {
      throw firstResult.error;
    }

    if (firstResult.type === "result") {
      rewardedInterstitialShowAttemptStartedAtMs = null;
      return firstResult.didEarnReward;
    }

    const didEarnReward = await rewardPromise;
    rewardedInterstitialShowAttemptStartedAtMs = null;
    return didEarnReward;
  } catch (error) {
    rewardedInterstitialShowAttemptStartedAtMs = null;
    logAppError("AdMob", error, {
      step: "show_rewarded_interstitial_ad",
    });
    rebuildRewardedInterstitialAd();
    return false;
  }
}

function waitForRewardedInterstitialResult(
  currentRewardedInterstitialAd: RewardedInterstitialAd,
): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    let hasEarnedReward = false;
    let hasSettled = false;
    let resultTimeout: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (resultTimeout) {
        clearTimeout(resultTimeout);
        resultTimeout = null;
      }
      closeDisposer();
      errorDisposer();
      rewardDisposer();
    };

    const settle = (nextHandler: () => void) => {
      if (hasSettled) {
        return;
      }

      hasSettled = true;
      cleanup();
      nextHandler();
    };

    const closeDisposer = currentRewardedInterstitialAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        logRewardedInterstitialTrace("result_closed", {
          hasEarnedReward,
        });
        settle(() => resolve(hasEarnedReward));
      },
    );

    const errorDisposer = currentRewardedInterstitialAd.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        logRewardedInterstitialTrace("result_error");
        settle(() => reject(error));
      },
    );

    const rewardDisposer = currentRewardedInterstitialAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        hasEarnedReward = true;
        logRewardedInterstitialTrace("result_earned_reward");
      },
    );

    resultTimeout = setTimeout(() => {
      settle(() => {
        logAppWarning("AdMob", "Rewarded interstitial ad result timed out", {
          step: "rewarded_interstitial_result_timeout",
        });
        resolve(false);
      });
    }, REWARDED_INTERSTITIAL_RESULT_TIMEOUT_MS);
  });
}

function createRewardedInterstitialAd(adUnitId: string) {
  const nextRewardedInterstitialAd = RewardedInterstitialAd.createForAdRequest(
    adUnitId,
    getAdRequestOptions(),
  );

  rewardedInterstitialAdDisposers = [
    nextRewardedInterstitialAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      isRewardedInterstitialLoaded = true;
      clearRewardedInterstitialLoadRetry();
      logRewardedInterstitialTrace("loaded");
    }),
    nextRewardedInterstitialAd.addAdEventListener(AdEventType.OPENED, () => {
      isRewardedInterstitialShowing = true;
      rewardedInterstitialOpenedAtMs = Date.now();
      hasRewardedInterstitialEarnedReward = false;
      logRewardedInterstitialTrace("opened");
    }),
    nextRewardedInterstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      const openedDurationMs =
        rewardedInterstitialOpenedAtMs === null
          ? null
          : Date.now() - rewardedInterstitialOpenedAtMs;
      if (
        openedDurationMs !== null &&
        openedDurationMs <= REWARDED_INTERSTITIAL_SHORT_CLOSE_THRESHOLD_MS &&
        !hasRewardedInterstitialEarnedReward
      ) {
        logAppWarning("AdMob", "Rewarded interstitial ad closed shortly after opening", {
          elapsedMs: openedDurationMs,
          step: "rewarded_interstitial_closed_shortly_after_open",
        });
      }
      logRewardedInterstitialTrace("closed", {
        hasEarnedReward: hasRewardedInterstitialEarnedReward,
        openedDurationMs,
      });
      isRewardedInterstitialLoaded = false;
      isRewardedInterstitialShowing = false;
      rewardedInterstitialOpenedAtMs = null;
      rebuildRewardedInterstitialAd();
    }),
    nextRewardedInterstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
      isRewardedInterstitialLoaded = false;
      isRewardedInterstitialShowing = false;
      rewardedInterstitialOpenedAtMs = null;
      logRewardedInterstitialTrace("error");
      logAdMobLoadError("AdMob", error, {
        step: "load_rewarded_interstitial_ad",
        unitId: adUnitId,
      });
      scheduleRewardedInterstitialAdRebuild();
    }),
    nextRewardedInterstitialAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      hasRewardedInterstitialEarnedReward = true;
      logRewardedInterstitialTrace("earned_reward");
    }),
  ];

  return nextRewardedInterstitialAd;
}

function rebuildRewardedInterstitialAd() {
  cleanupRewardedInterstitialAd();

  const adUnitId = resolveRewardedInterstitialAdUnitId();
  if (!adUnitId) {
    return;
  }

  rewardedInterstitialAd = createRewardedInterstitialAd(adUnitId);
  rewardedInterstitialAd.load();
}

function cleanupRewardedInterstitialAd() {
  for (const dispose of rewardedInterstitialAdDisposers) {
    dispose();
  }

  rewardedInterstitialAdDisposers = [];
  rewardedInterstitialAd = null;
}

function scheduleRewardedInterstitialAdRebuild() {
  cleanupRewardedInterstitialAd();

  if (loadRetryTimer) {
    return;
  }

  loadRetryTimer = setTimeout(() => {
    loadRetryTimer = null;
    preloadRewardedInterstitialAd();
  }, REWARDED_INTERSTITIAL_LOAD_RETRY_DELAY_MS);
}

function clearRewardedInterstitialLoadRetry() {
  if (!loadRetryTimer) {
    return;
  }

  clearTimeout(loadRetryTimer);
  loadRetryTimer = null;
}

function logRewardedInterstitialTrace(step: string, context?: Record<string, unknown>) {
  if (!__DEV__) {
    return;
  }

  console.info("[AdMob] rewarded_interstitial_trace", {
    ...context,
    elapsedSinceOpenMs:
      rewardedInterstitialOpenedAtMs === null ? null : Date.now() - rewardedInterstitialOpenedAtMs,
    elapsedSinceShowRequestMs:
      rewardedInterstitialShowAttemptStartedAtMs === null
        ? null
        : Date.now() - rewardedInterstitialShowAttemptStartedAtMs,
    isLoaded: isRewardedInterstitialLoaded,
    isShowing: isRewardedInterstitialShowing,
    step,
  });
}

function resolveRewardedInterstitialAdUnitId() {
  return resolveAdMobAdUnitId(
    AdMobRewardedInterstitialConfig,
    TestIds.REWARDED_INTERSTITIAL,
  );
}

function logMissingRewardedInterstitialAdUnitId() {
  if (hasLoggedMissingRewardedInterstitialAdUnitId) {
    return;
  }

  hasLoggedMissingRewardedInterstitialAdUnitId = true;
  logAppWarning("AdMob", "Rewarded interstitial ad unit id is missing", {
    platform: Platform.OS,
    step: "resolve_rewarded_interstitial_ad_unit_id",
  });
}
