import type { AppLanguage } from "../i18n/types";

export const AppCurrencies = ["KRW", "USD"] as const;

export type AppCurrency = (typeof AppCurrencies)[number];

export const DefaultCurrencyByLanguage: Record<AppLanguage, AppCurrency> = {
  en: "USD",
  ko: "KRW",
};

export const CurrencyFormatConfig: Record<
  AppCurrency,
  {
    locale: string;
    maximumFractionDigits: number;
    minimumFractionDigits: number;
    prefix: string;
    suffix: string;
  }
> = {
  KRW: {
    locale: "ko-KR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    prefix: "",
    suffix: "원",
  },
  USD: {
    locale: "en-US",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    prefix: "USD ",
    suffix: "",
  },
};

export const CurrencyUnitLabels: Record<AppCurrency, string> = {
  KRW: "원",
  USD: "USD",
};
