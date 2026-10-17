import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { RewardedInterstitialNoticeConfig } from "../constants/ads";
import {
  hasSeenDailyFirstEntrySaveInterstitialNotice,
  hasShownDailyFirstEntrySaveInterstitial,
  markDailyFirstEntrySaveInterstitialNoticeSeen,
  markDailyFirstEntrySaveInterstitialShown,
} from "../lib/ads/dailyFirstEntryInterstitial";
import {
  isRewardedInterstitialAdReady,
  showRewardedInterstitialAd,
} from "../lib/ads/rewardedInterstitialAd";
import { logAppError } from "../lib/logAppError";
import { toIsoDate } from "../utils/calendar";

type PendingAd = { userId: string; date: string; screen: string };

export function useDailyFirstEntryAd({ userId, screen, isReady, isSubscriptionLoading, isFree }: {
  userId: string;
  screen: string;
  isReady: boolean;
  isSubscriptionLoading: boolean;
  isFree: boolean;
}) {
  const [pending, setPending] = useState<PendingAd | null>(null);
  const [isNoticeVisible, setIsNoticeVisible] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const showing = useRef(false);
  const opened = useRef<Pick<PendingAd, "userId" | "date"> | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", setAppState);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!pending) return;
    if (pending.userId !== userId || pending.date !== toIsoDate(new Date()) ||
        (!isSubscriptionLoading && !isFree)) {
      setPending(null);
      return;
    }
    if (!isReady || isSubscriptionLoading || appState !== "active" || pending.screen !== screen) return;

    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let noticeStartedAt: number | null = null;
    const reportError = (error: unknown) => logAppError("AdMob", error, { step: "daily_first_entry_ad" });
    const attempt = () => {
      if (disposed) return;
      try {
        const today = toIsoDate(new Date());
        if (pending.date !== today || hasShownDailyFirstEntrySaveInterstitial(userId, today) ||
            (opened.current?.userId === userId && opened.current.date === today)) {
          setPending(null);
          return;
        }
        if (showing.current || AppState.currentState !== "active" || !isRewardedInterstitialAdReady()) {
          noticeStartedAt = null;
          setIsNoticeVisible(false);
          schedule();
          return;
        }
        if (!hasSeenDailyFirstEntrySaveInterstitialNotice(userId)) {
          noticeStartedAt ??= Date.now();
          if (Date.now() - noticeStartedAt < RewardedInterstitialNoticeConfig.previewDurationMs) {
            setIsNoticeVisible(true);
            schedule();
            return;
          }
        }
        setIsNoticeVisible(false);
        showing.current = true;
        void showRewardedInterstitialAd(() => {
          const date = toIsoDate(new Date());
          opened.current = { userId, date };
          // Record exposure at OPENED, even if the app exits before CLOSED.
          try {
            markDailyFirstEntrySaveInterstitialShown(userId, date);
            markDailyFirstEntrySaveInterstitialNoticeSeen(userId);
          } catch (error) {
            reportError(error);
          }
          if (!disposed) setPending(null);
        }).catch(reportError).finally(() => {
          showing.current = false;
          schedule();
        });
      } catch (error) {
        reportError(error);
        setIsNoticeVisible(false);
        // Storage/SDK errors must never propagate to entry saving.
        if (!disposed) setPending(null);
      }
    };
    const schedule = () => {
      if (!disposed) timer = setTimeout(attempt, RewardedInterstitialNoticeConfig.readyPollIntervalMs);
    };
    schedule();
    return () => {
      disposed = true;
      clearTimeout(timer);
      setIsNoticeVisible(false);
    };
  }, [pending, userId, screen, isReady, isSubscriptionLoading, isFree, appState]);

  return {
    isNoticeVisible,
    requestAdAfterSave: () => {
      const date = toIsoDate(new Date());
      setPending((current) => current?.userId === userId && current.date === date
        ? current : { userId, date, screen });
    },
  };
}
