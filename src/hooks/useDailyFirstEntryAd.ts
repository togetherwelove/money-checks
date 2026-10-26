import { useEffect, useRef } from "react";
import { AppState } from "react-native";

import { EntryRegistrationCopy } from "../constants/entryRegistration";
import { hasCompletedDailyFirstEntryAd, markDailyFirstEntryAdCompleted } from "../lib/ads/dailyFirstEntryInterstitial";
import { showRewardedInterstitialAd, waitForRewardedInterstitialAdReady } from "../lib/ads/rewardedInterstitialAd";
import { logAppError } from "../lib/logAppError";
import { showNativeToast } from "../lib/nativeToast";
import { toIsoDate } from "../utils/calendar";

type Context = {
  userId: string;
  bookId: string | null;
  isReady: boolean;
  isSubscriptionLoading: boolean;
  isFree: boolean;
};

export function useDailyFirstEntryAd(context: Context) {
  const current = useRef(context);
  current.current = context;
  const mounted = useRef(true);
  const inFlight = useRef(false);
  const completed = useRef<{ userId: string; date: string } | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  return { ensureAdBeforeSave: async (): Promise<boolean> => {
    if (inFlight.current) return false;
    const origin = current.current;
    const isCurrent = () => mounted.current && current.current.userId === origin.userId &&
      current.current.bookId === origin.bookId;
    const unavailable = () => {
      if (isCurrent()) showNativeToast(EntryRegistrationCopy.dailyFirstEntryAdUnavailableError);
      return false;
    };
    if (!isCurrent() || !origin.bookId) return false;
    if (origin.isSubscriptionLoading) return unavailable();
    if (!origin.isFree) return true;

    inFlight.current = true;
    try {
      const today = toIsoDate(new Date());
      if ((completed.current?.userId === origin.userId && completed.current.date === today) ||
          hasCompletedDailyFirstEntryAd(origin.userId, today)) return true;
      if (!origin.isReady || AppState.currentState !== "active") return unavailable();
      const ready = await waitForRewardedInterstitialAdReady();
      if (!isCurrent()) return false;
      if (!ready || AppState.currentState !== "active") return unavailable();
      const result = await showRewardedInterstitialAd();
      if (!isCurrent()) return false;
      if (!result.didOpen || !result.didClose) return unavailable();
      if (!result.didEarnReward) {
        showNativeToast(EntryRegistrationCopy.dailyFirstEntryRewardRequiredError);
        return false;
      }
      const date = toIsoDate(new Date());
      completed.current = { userId: origin.userId, date };
      try {
        markDailyFirstEntryAdCompleted(origin.userId, date);
      } catch (error) {
        logAppError("AdMob", error, { step: "record_completed_entry_ad" });
      }
      return true;
    } catch (error) {
      logAppError("AdMob", error, { step: "entry_ad_before_save" });
      return unavailable();
    } finally {
      inFlight.current = false;
    }
  } };
}
