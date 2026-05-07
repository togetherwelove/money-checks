import { selectStaticCopy } from "../i18n/staticCopy";

export const SubscriptionBenefitMessages = selectStaticCopy({
  en: {
    items: ["· Remove all ads", "· Access up to 3 ledgers", "· Share each ledger with 5 members"],
  },
  ko: {
    items: ["· 광고 모두 제거", "· 가계부 동시 최대 3개", "· 가계부당 공유 멤버 최대 5명"],
  },
} as const);
