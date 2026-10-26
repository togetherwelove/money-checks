import { appStorage } from "../appStorage";

const DAILY_FIRST_ENTRY_SAVE_INTERSTITIAL_STORAGE_KEY_PREFIX =
  "money-checks.ads.daily-first-entry-save.completed.v3";

export function hasCompletedDailyFirstEntryAd(userId: string, todayKey: string) {
  return appStorage.getItem(createDailyFirstEntrySaveInterstitialKey(userId)) === todayKey;
}

export function markDailyFirstEntryAdCompleted(userId: string, todayKey: string) {
  appStorage.setItem(createDailyFirstEntrySaveInterstitialKey(userId), todayKey);
}

function createDailyFirstEntrySaveInterstitialKey(userId: string) {
  return `${DAILY_FIRST_ENTRY_SAVE_INTERSTITIAL_STORAGE_KEY_PREFIX}.${userId}`;
}
