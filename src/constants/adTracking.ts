import { selectStaticCopy } from "../i18n/staticCopy";

export const AdTrackingCopy = selectStaticCopy({
  en: {
    actionOpenSettings: "Open Settings",
    actionRequest: "Allow Tracking",
    description: "Used on the Free plan to provide more relevant ads and measure ad performance.",
    statusAuthorized: "Allowed",
    statusDenied: "Not Allowed",
    statusNotDetermined: "Not Set",
    statusUnavailable: "Unavailable",
    title: "Personalized Ads",
  },
  ko: {
    actionOpenSettings: "설정 열기",
    actionRequest: "추적 허용",
    description: "Free 플랜에서 더 관련성 높은 광고를 제공하고 광고 성과를 측정하는 데 사용돼요.",
    statusAuthorized: "허용됨",
    statusDenied: "허용 안 됨",
    statusNotDetermined: "요청 전",
    statusUnavailable: "사용 불가",
    title: "맞춤형 광고",
  },
} as const);

export const AdTrackingUi = {
  actionRowGap: 8,
  descriptionLineHeight: 18,
  descriptionTextSize: 12,
  rowGap: 8,
  statusFontSize: 13,
} as const;
