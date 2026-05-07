import { selectStaticCopy } from "../i18n/staticCopy";

export const HelpCopy = selectStaticCopy({
  en: {
    linkDescription: "Open the policy document you need in your browser.",
    openLinkError: "Could not open the link. Please try again.",
    privacyPolicyDescription: "Privacy collection, use, retention, and rights information",
    privacyPolicyLabel: "Privacy Policy",
    screenTitle: "Help",
    termsOfUseDescription: "Service terms, subscriptions, and responsibility scope",
    termsOfUseLabel: "Terms of Use",
  },
  ko: {
    linkDescription: "필요한 정책 문서를 브라우저에서 확인할 수 있어요.",
    openLinkError: "링크를 열지 못했어요. 다시 시도해 주세요.",
    privacyPolicyDescription: "개인정보 수집, 이용, 보관 및 권리 안내",
    privacyPolicyLabel: "개인정보 처리방침",
    screenTitle: "도움말",
    termsOfUseDescription: "서비스 이용 조건, 구독 및 책임 범위 안내",
    termsOfUseLabel: "이용약관",
  },
} as const);
