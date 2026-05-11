import { type AppCurrency, CurrencyFormatConfig } from "../constants/currency";
import { resolveDisplayCurrency } from "../lib/currencyPreference";

const CurrencyNumberFormatters = Object.fromEntries(
  Object.entries(CurrencyFormatConfig).map(([currency, config]) => [
    currency,
    new Intl.NumberFormat(config.locale, {
      maximumFractionDigits: config.maximumFractionDigits,
      minimumFractionDigits: config.minimumFractionDigits,
    }),
  ]),
) as Record<AppCurrency, Intl.NumberFormat>;

export function formatCurrency(amount: number, currency = resolveDisplayCurrency()): string {
  const config = CurrencyFormatConfig[currency];
  const amountLabel = CurrencyNumberFormatters[currency].format(amount);

  return `${config.prefix}${amountLabel}${config.suffix}`;
}

export function formatCurrencyNumber(amount: number, currency = resolveDisplayCurrency()): string {
  return CurrencyNumberFormatters[currency].format(amount);
}
