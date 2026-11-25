import { AppFontSize, AppLineHeight } from "./typography";
import { SubscriptionConfig } from "./subscription";
import type { CategoryIconName } from "../types/category";

export const SubscriptionPageCopy = {
  headline: "기록은 가볍게,\n함께하는 범위는 넓게.",
  description: "광고 없이 쓰고, 가계부를 나누고, 소중한 사람들과 함께 기록하세요.",
  planTitle: "월간 구독",
  billingSummary: "매월 자동 갱신",
  privacyAction: "개인정보 처리방침",
  termsAction: "이용약관",
  linkError: "링크를 열지 못했어요. 다시 시도해 주세요.",
} as const;

export const SubscriptionPageBenefits = [
  {
    icon: "eye-off",
    title: "광고 없이 더 편하게",
    description: "앱의 광고를 제거해 나의 기록에 집중할 수 있어요.",
    value: "광고 없음",
  },
  {
    icon: "book-open",
    title: "나눠서 관리하는 가계부",
    description: "일상과 여행, 개인과 공동 기록을 나눠 보세요.",
    value: `${SubscriptionConfig.plusOwnedLedgerBookLimit}개`,
  },
  {
    icon: "users",
    title: "함께 쓰는 우리의 기록",
    description: `가계부마다 최대 ${SubscriptionConfig.plusSharedMemberLimit}명까지 함께 기록할 수 있어요.`,
    value: `${SubscriptionConfig.plusSharedMemberLimit}명`,
  },
] as const satisfies readonly {
  icon: CategoryIconName;
  title: string;
  description: string;
  value: string;
}[];

export const SubscriptionPageDesign = {
  headlineFontSize: AppFontSize.display,
  headlineLineHeight: AppLineHeight.display,
  priceFontSize: AppFontSize.display,
  priceLineHeight: AppLineHeight.display,
  benefitVerticalPadding: 20,
} as const;
