import { selectStaticCopy } from "../i18n/staticCopy";

export const SubscriptionManagementMessages = selectStaticCopy({
  en: {
    actionLabel: "Manage Subscription",
    openError: "Could not open subscription management.",
  },
  ko: {
    actionLabel: "구독 관리",
    openError: "구독 관리 화면을 열지 못했어요.",
  },
} as const);

export const SubscriptionManagementConfig = {
  androidPackageName: "com.chanwook.moneychecks",
  iosManageUrl: "https://apps.apple.com/account/subscriptions",
} as const;
