import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { readStoredLanguage, resolveSupportedLanguage, storeLanguage } from "./languageStorage";
import { en } from "./resources/en";
import { ko } from "./resources/ko";
import type { AppLanguage } from "./types";

const DEFAULT_LANGUAGE: AppLanguage = "ko";

function resolveDeviceLanguage(): AppLanguage {
  const locale = Localization.getLocales()[0];
  return resolveSupportedLanguage(locale?.languageCode) ?? DEFAULT_LANGUAGE;
}

export function resolveInitialLanguage(): AppLanguage {
  const storedLanguage = readStoredLanguage();
  if (storedLanguage) {
    return storedLanguage;
  }

  const deviceLanguage = resolveDeviceLanguage();
  storeLanguage(deviceLanguage);
  return deviceLanguage;
}

void i18n.use(initReactI18next).init({
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: {
    escapeValue: false,
  },
  lng: resolveInitialLanguage(),
  react: {
    useSuspense: false,
  },
  resources: {
    en: { translation: en },
    ko: { translation: ko },
  },
});

export async function changeAppLanguage(language: AppLanguage): Promise<void> {
  storeLanguage(language);
  await i18n.changeLanguage(language);
}

export { i18n };
export type { AppLanguage };
