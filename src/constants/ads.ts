import { selectStaticCopy } from "../i18n/staticCopy";

export const AdMobTestUnitIds = {
  iosBanner: "ca-app-pub-3940256099942544/2934735716",
  androidBanner: "ca-app-pub-3940256099942544/6300978111",
  iosInterstitial: "ca-app-pub-3940256099942544/4411468910",
  androidInterstitial: "ca-app-pub-3940256099942544/1033173712",
  iosNative: "ca-app-pub-3940256099942544/3986624511",
  androidNative: "ca-app-pub-3940256099942544/2247696110",
} as const;

export const AdMobInterstitialConfig = {
  androidAdUnitId: process.env.EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL_AD_UNIT_ID ?? "",
  iosAdUnitId: process.env.EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL_AD_UNIT_ID ?? "",
} as const;

export const AdMobNativeConfig = {
  androidAdUnitId: process.env.EXPO_PUBLIC_ADMOB_ANDROID_NATIVE_AD_UNIT_ID ?? "",
  iosAdUnitId: process.env.EXPO_PUBLIC_ADMOB_IOS_NATIVE_AD_UNIT_ID ?? "",
} as const;

export const AdInterstitialPlacement = {
  annualReportDownload: "annual-report-download",
  joinRequestSend: "join-request-send",
  shareCodeCopy: "share-code-copy",
} as const;

export type AdInterstitialPlacementKey =
  (typeof AdInterstitialPlacement)[keyof typeof AdInterstitialPlacement];

export const NativeAdListConfig = {
  insertionStartAfterEntryCount: 6,
  insertionIntervalMax: 10,
  insertionIntervalMin: 6,
  insertionIntervalRandomMultiplier: 37,
  insertionIntervalRandomSeed: 11,
  sponsoredLabel: selectStaticCopy({
    en: "Ad ",
    ko: "광고 ",
  }),
} as const;

export const NativeAdCardUi = {
  advertiserGap: 4,
  callToActionBorderRadius: 999,
  callToActionPaddingHorizontal: 10,
  callToActionPaddingVertical: 5,
  contentGap: 4,
  iconBorderRadius: 8,
  iconSize: 40,
  minHeight: 76,
  primaryRowGap: 8,
  verticalInset: 8,
} as const;
