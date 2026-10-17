
export const SubscriptionHeroUi = {
  brandDescriptionGap: 16,
  brandFontSize: 32,
  brandLineHeight: 42,
} as const;

export const SubscriptionTiers = {
  free: "free",
  plus: "plus",
} as const;

export type SubscriptionTier = (typeof SubscriptionTiers)[keyof typeof SubscriptionTiers];

export const SubscriptionConfig = {
  freeAccessibleLedgerBookLimit: 1,
  freeSharedMemberLimit: 2,
  freeOwnedLedgerBookLimit: 1,
  monthlyPackageIdentifier: "monthly",
  plusAccessibleLedgerBookLimit: 3,
  plusOwnedLedgerBookLimit: 3,
  plusSharedMemberLimit: 5,
  plusEntitlementId: "plus",
} as const;

export const RevenueCatConfig = {
  iosPublicApiKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? "",
  publicApiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? "",
} as const;

export const SubscriptionMessages = {
    heroBrandName: "알뜰",
    heroBrandPlus: "plus",
    freePlanLabel: "Free 플랜",
    heroDescription:
      "알뜰에서 광고로 불편함 없이\n하나 이상의 가계부를 관리하고,\n더 많은 공유 멤버와 함께하세요.",
    heroPriceLabel: "￦770원/월",
    inactiveRestoreMessage: "구매 내역을 확인했지만 복원할 활성 알뜰 plus 구독이 없어요.",
    manageAction: "구독 관리",
    monthlyPriceSuffix: "/월",
    plusSummary: "현재 구독 중이에요.",
    purchaseAction: "알뜰 plus 구독",
    purchaseError: "알뜰 plus 구독 처리가 잘 안됐어요.",
    purchaseInfoDefaultPeriodValue: "1개월마다",
    purchaseInfoNameLabel: "구독명",
    purchaseInfoPeriodLabel: "구독 기간",
    purchaseInfoPriceLabel: "가격",
    purchaseSuccess: "알뜰 plus가 활성화되었어요.",
    restoreAction: "구매 복원",
    restoreError: "구매 내역을 복원하지 못했어요. 잠시 후 다시 시도해 주세요.",
    restoreSuccess: "구매 내역을 복원했어요. 알뜰 plus 이용 중입니다.",
    screenTitle: "알뜰 plus",
    sharedLedgerLimitDescription: "Free 플랜 한도에 도달했어요.",
    statusLabel: "현재 플랜",
  } as const;
