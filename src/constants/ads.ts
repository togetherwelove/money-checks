import { selectStaticCopy } from "../i18n/staticCopy";

export const AdMobTestUnitIds = {
  iosBanner: "ca-app-pub-3940256099942544/2934735716",
  iosInterstitial: "ca-app-pub-3940256099942544/4411468910",
  iosRewardedInterstitial: "ca-app-pub-3940256099942544/6978759866",
  iosNative: "ca-app-pub-3940256099942544/3986624511",
} as const;

export const AdMobInterstitialConfig = {
  iosAdUnitId: process.env.EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL_AD_UNIT_ID ?? "",
} as const;

export const AdMobRewardedInterstitialConfig = {
  iosAdUnitId: process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED_INTERSTITIAL_AD_UNIT_ID ?? "",
} as const;

export const RewardedInterstitialNoticeConfig = {
  previewDurationMs: 900,
} as const;

export const RewardedInterstitialNoticeOverlayUi = {
  cardGap: 8,
  cardMaxWidth: 320,
  cardPaddingHorizontal: 18,
  cardPaddingVertical: 16,
  cardRadius: 18,
  copyGap: 2,
  titleFontSize: 16,
  titleLineHeight: 22,
  messageFontSize: 13,
  messageLineHeight: 19,
} as const;

export const AdMobNativeConfig = {
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
  advertiserFontSize: 11,
  advertiserGap: 4,
  callToActionGap: 4,
  callToActionIconButtonSize: 32,
  callToActionIconSize: 15,
  callToActionIconBorderRadius: 16,
  callToActionPaddingHorizontal: 10,
  callToActionTextFontSize: 11,
  callToActionTextMaxWidth: 72,
  contentPaddingHorizontal: 0,
  contentPaddingVertical: 6,
  contentGap: 8,
  headerAdChoicesReservedWidth: 56,
  headerGap: 6,
  iconBorderRadius: 5,
  iconFrameBorderRadius: 8,
  iconFrameSize: 48,
  iconSize: 40,
  minHeight: 62,
  primaryRowGap: 8,
  bodyFontSize: 12,
  bodyLineHeight: 16,
  headlineFontSize: 14,
  headlineLineHeight: 18,
  sponsoredLabelFontSize: 11,
  textBlockGap: 2,
} as const;
