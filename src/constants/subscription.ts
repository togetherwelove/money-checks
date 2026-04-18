export const SubscriptionTiers = {
  free: "free",
  plus: "plus",
} as const;

export type SubscriptionTier = (typeof SubscriptionTiers)[keyof typeof SubscriptionTiers];

export const SubscriptionConfig = {
  freeSharedMemberLimit: 2,
  monthlyPackageIdentifier: "monthly",
  plusEntitlementId: "plus",
} as const;

export const RevenueCatConfig = {
  publicApiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? "",
} as const;

export const AdMobConfig = {
  androidAppId: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ?? "",
  androidBannerAdUnitId: process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_AD_UNIT_ID ?? "",
  iosAppId: process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID ?? "",
  iosBannerAdUnitId: process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_AD_UNIT_ID ?? "",
} as const;

export const SubscriptionMessages = {
  freePlanLabel: "Free 플랜",
  heroDescription: "알뜰에서 광고 없이 편하게, 더욱 많은 사람과 함께 가계부를 관리할 수 있어요.",
  heroPriceLabel: "￦770원/월",
  inactiveRestoreMessage: "활성화된 알뜰 Plus 구독이 없어요.",
  plusPlanLabel: "Plus 활성화",
  plusSummary: "광고 제거 및 공유 인원 제한 없음",
  purchaseAction: "알뜰 Plus 가입",
  purchaseError: "알뜰 Plus 가입을 처리하지 못했어요.",
  purchaseSuccess: "알뜰 Plus가 활성화되었어요.",
  restoreAction: "구매 복원",
  restoreError: "구매 내역을 복원하지 못했어요.",
  restoreSuccess: "구매 내역을 복원했어요.",
  screenTitle: "알뜰 Plus",
  sharedLedgerLimitDescription: "Free 플랜은 본인을 포함해 최대 2명까지만 공유할 수 있어요.",
  statusLabel: "현재 플랜",
} as const;
