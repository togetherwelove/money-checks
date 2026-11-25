import { SubscriptionPageCopy } from "./subscriptionPage";
import { LegalLinks } from "./legal";

export const AllMenuCopy = {
  account: "계정 관리",
} as const;

export const AllMenuLegalLinks = [
  { label: "개인정보처리방침", url: LegalLinks.privacyPolicyUrl },
  { label: "서비스약관", url: LegalLinks.termsOfUseUrl },
] as const;

export const AllMenuIcons = { excelExport: "file-excel-outline" } as const;

export const MenuSubscriptionCopy = {
  headline: SubscriptionPageCopy.headline.replace(/\n/g, " "),
  description: SubscriptionPageCopy.description,
  upgradeAction: "업그레이드",
} as const;

export const MenuSubscriptionDesign = {
  copyMinimumWidth: 180,
  buttonHeight: 36,
  buttonHorizontalPadding: 14,
  buttonVerticalPadding: 6,
  buttonHitSlop: 4,
} as const;
