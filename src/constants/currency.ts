export type AppCurrency = "KRW";

export const DefaultCurrency: AppCurrency = "KRW";

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
};

export const CurrencyUnitLabels: Record<AppCurrency, string> = {
  KRW: "원",
};
