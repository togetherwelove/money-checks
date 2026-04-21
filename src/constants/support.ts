import { AppColors } from "./colors";

export const SupportConfig = {
  offeringIdentifier: "support",
  packageIdentifiers: {
    large: "support_large",
    medium: "support_medium",
    small: "support_small",
  },
} as const;

export type SupportPackageIdentifier =
  (typeof SupportConfig.packageIdentifiers)[keyof typeof SupportConfig.packageIdentifiers];

export type SupportPackageCatalogItem = {
  description: string;
  iconBackgroundColor: string;
  iconColor: string;
  iconName: "coffee-outline" | "cup-outline" | "food-drumstick-outline";
  identifier: SupportPackageIdentifier;
  title: string;
};

export const SupportPackageCatalog: readonly SupportPackageCatalogItem[] = [
  {
    description: "개발자가 가장 좋아해요.",
    iconBackgroundColor: AppColors.accentSoft,
    iconColor: AppColors.accent,
    iconName: "cup-outline",
    identifier: SupportConfig.packageIdentifiers.small,
    title: "바나나우유 사주기",
  },
  {
    description: "앱 개발에 큰 도움이 돼요.",
    iconBackgroundColor: AppColors.surfaceStrong,
    iconColor: AppColors.primary,
    iconName: "coffee-outline",
    identifier: SupportConfig.packageIdentifiers.medium,
    title: "커피 한 잔 사주기",
  },
  {
    description: "개발자 가족의 하루가 완벽해져요.",
    iconBackgroundColor: AppColors.expenseSoft,
    iconColor: AppColors.expense,
    iconName: "food-drumstick-outline",
    identifier: SupportConfig.packageIdentifiers.large,
    title: "치킨 한 마리 사주기",
  },
] as const;

export const SupportMessages = {
  purchaseAction: "후원하기",
  purchaseError: "후원을 처리하지 못했어요.",
  purchaseSuccess: "후원해 주셔서 감사합니다.",
  pricePendingLabel: "가격 확인 중",
  screenTitle: "후원하기",
  unavailableDescription: "아직 후원 상품을 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.",
} as const;

export const SupportUi = {
  actionIconSize: 14,
  cardGap: 10,
  contentGap: 16,
  iconContainerRadius: 14,
  iconContainerSize: 48,
  iconSize: 24,
  listGap: 10,
  priceLabelFontSize: 16,
  rowGap: 12,
  subtitleFontSize: 12,
  titleFontSize: 16,
} as const;
