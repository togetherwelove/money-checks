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
  actionsTitle: "구독 관리",
  cardTitle: "알뜰 Plus",
  freePlanLabel: "Free 플랜",
  plusPlanLabel: "Plus 활성화",
  statusLabel: "현재 플랜",
  menuTitle: "알뜰 Plus",
  screenTitle: "알뜰 Plus",
  screenDescription: "광고 없이 보고, 공유 가계부를 더 넓게 운영할 수 있어요.",
  heroBadge: "광고 없이 · 공유 인원 제한 없이",
  heroTitle: "가계부를 다함께, 더 편하게 쓰세요.",
  comparisonTitle: "플랜 비교",
  comparisonFreeLabel: "Free",
  comparisonPlusLabel: "Plus",
  comparisonFreeHeadline: "가볍게 시작",
  comparisonPlusHeadline: "제한 없이 사용",
  adsComparisonLabel: "광고",
  adsFreeValue: "표시",
  adsPlusValue: "없음",
  membersComparisonLabel: "공유 가계부 인원",
  membersFreeValue: "본인 포함 2명",
  membersPlusValue: "제한 없음",
  freeSummary: "광고 표시 · 공유 가계부 2인까지",
  plusSummary: "광고 제거 · 공유 인원 제한 없음",
  plusBenefitDescription: "광고 제거 및 공유 인원 제한 없음",
  sharedLedgerLimitDescription: "Free 플랜은 본인을 포함해 최대 2명까지만 공유할 수 있어요.",
  sharedLedgerLimitError: "Free 플랜은 본인을 포함해 최대 2명까지만 공유할 수 있어요.",
  manageAction: "구독하러가기",
  purchaseAction: "Plus 구독",
  purchaseError: "Plus 구독을 처리하지 못했어요.",
  purchaseSuccess: "알뜰 Plus가 활성화됐어요.",
  restoreAction: "구매 복원",
  restoreError: "구매 내역을 복원하지 못했어요.",
  restoreSuccess: "구매 내역을 복원했어요.",
  inactiveRestoreMessage: "활성화된 Plus 구독이 없어요.",
} as const;
