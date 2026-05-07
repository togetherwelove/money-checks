import { appStorage } from "../lib/appStorage";
import { type AppLanguage, AppLanguages } from "./types";

const LANGUAGE_STORAGE_KEY = "moneychecks.language";

export function readStoredLanguage(): AppLanguage | null {
  return resolveSupportedLanguage(appStorage.getItem(LANGUAGE_STORAGE_KEY));
}

export function storeLanguage(language: AppLanguage): void {
  appStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

export function resolveSupportedLanguage(value: string | null | undefined): AppLanguage | null {
  return AppLanguages.find((language) => language === value) ?? null;
}
