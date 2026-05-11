import { AppCurrencies, type AppCurrency, DefaultCurrencyByLanguage } from "../constants/currency";
import { resolveStaticCopyLanguage } from "../i18n/staticCopy";
import type { AppLanguage } from "../i18n/types";
import { appStorage } from "./appStorage";

const CURRENCY_STORAGE_KEY = "moneychecks.displayCurrency";

export function readStoredCurrency(): AppCurrency | null {
  return resolveSupportedCurrency(appStorage.getItem(CURRENCY_STORAGE_KEY));
}

export function resolveDefaultCurrencyForLanguage(language: AppLanguage): AppCurrency {
  return DefaultCurrencyByLanguage[language];
}

export function resolveDisplayCurrency(language = resolveStaticCopyLanguage()): AppCurrency {
  return readStoredCurrency() ?? resolveDefaultCurrencyForLanguage(language);
}

export function storeCurrency(currency: AppCurrency): void {
  appStorage.setItem(CURRENCY_STORAGE_KEY, currency);
}

export function resolveSupportedCurrency(value: string | null | undefined): AppCurrency | null {
  return AppCurrencies.find((currency) => currency === value) ?? null;
}
