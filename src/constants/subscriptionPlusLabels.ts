import { selectStaticCopy } from "../i18n/staticCopy";

export const SubscriptionPlusLabels = selectStaticCopy({
  en: {
    accountActiveSuffix: "Active",
    menuPrefix: "Alttle",
    purchaseActionPrefix: "Join Alttle",
    purchaseActionSuffix: "",
  },
  ko: {
    accountActiveSuffix: "활성화",
    menuPrefix: "알뜰",
    purchaseActionPrefix: "알뜰",
    purchaseActionSuffix: "가입",
  },
} as const);
