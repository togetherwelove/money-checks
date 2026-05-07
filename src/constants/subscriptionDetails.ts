import { selectStaticCopy } from "../i18n/staticCopy";

export const SubscriptionDetailCopy = selectStaticCopy({
  en: {
    collapseAction: "Hide Details",
    expandAction: "View Details",
    legalLinkError: "Could not open the link. Please try again.",
    privacyPolicyAction: "Privacy Policy",
    termsOfUseAction: "Terms of Use",
  },
  ko: {
    collapseAction: "접기",
    expandAction: "자세히보기",
    legalLinkError: "링크를 열지 못했어요. 다시 시도해 주세요.",
    privacyPolicyAction: "개인정보 처리방침",
    termsOfUseAction: "이용약관",
  },
} as const);
