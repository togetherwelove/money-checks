import { appStorage } from "../appStorage";

const DAILY_FIRST_ENTRY_SAVE_INTERSTITIAL_STORAGE_KEY_PREFIX =
  "money-checks.ads.daily-first-entry-save";
const DAILY_FIRST_ENTRY_SAVE_INTERSTITIAL_NOTICE_STORAGE_KEY_PREFIX =
  "money-checks.ads.daily-first-entry-save.notice";
const DAILY_FIRST_ENTRY_SAVE_INTERSTITIAL_NOTICE_SHOWN_VALUE = "shown";

export function hasShownDailyFirstEntrySaveInterstitial(userId: string, todayKey: string) {
  return appStorage.getItem(createDailyFirstEntrySaveInterstitialKey(userId)) === todayKey;
}

export function markDailyFirstEntrySaveInterstitialShown(userId: string, todayKey: string) {
  appStorage.setItem(createDailyFirstEntrySaveInterstitialKey(userId), todayKey);
}

export function hasSeenDailyFirstEntrySaveInterstitialNotice(userId: string) {
  return (
    appStorage.getItem(createDailyFirstEntrySaveInterstitialNoticeKey(userId)) ===
    DAILY_FIRST_ENTRY_SAVE_INTERSTITIAL_NOTICE_SHOWN_VALUE
  );
}

export function markDailyFirstEntrySaveInterstitialNoticeSeen(userId: string) {
  appStorage.setItem(
    createDailyFirstEntrySaveInterstitialNoticeKey(userId),
    DAILY_FIRST_ENTRY_SAVE_INTERSTITIAL_NOTICE_SHOWN_VALUE,
  );
}

function createDailyFirstEntrySaveInterstitialKey(userId: string) {
  return `${DAILY_FIRST_ENTRY_SAVE_INTERSTITIAL_STORAGE_KEY_PREFIX}.${userId}`;
}

function createDailyFirstEntrySaveInterstitialNoticeKey(userId: string) {
  return `${DAILY_FIRST_ENTRY_SAVE_INTERSTITIAL_NOTICE_STORAGE_KEY_PREFIX}.${userId}`;
}
