import { selectStaticCopy } from "../i18n/staticCopy";

export const OpenSourceLicensesCopy = selectStaticCopy({
  en: {
    helpMenuDescription: "Open-source software notices used by the app",
    screenTitle: "Open Source Licenses",
  },
  ko: {
    helpMenuDescription: "앱에서 사용하는 오픈소스 소프트웨어 고지",
    screenTitle: "오픈소스 라이선스",
  },
} as const);
