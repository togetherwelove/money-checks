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
  entrySaveTest: "entry-save-test",
  shareCodeCopy: "share-code-copy",
} as const;

export type AdInterstitialPlacementKey =
  (typeof AdInterstitialPlacement)[keyof typeof AdInterstitialPlacement];

export const NativeAdListConfig = {
  insertionStartAfterEntryCount: 6,
  insertionInterval: 10,
  sponsoredLabel: "광고 ",
} as const;
