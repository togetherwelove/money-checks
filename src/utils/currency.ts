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

const KrwAxisUnits = [
  { divisor: 100_000_000, label: "억" },
  { divisor: 10_000, label: "만" },
  { divisor: 1_000, label: "천" },
] as const;
const KRW_AXIS_MAX_FRACTION_DIGITS = 2;
const KrwAxisNumberFormatter = new Intl.NumberFormat(CurrencyFormatConfig.KRW.locale, {
  maximumFractionDigits: KRW_AXIS_MAX_FRACTION_DIGITS,
});

export function formatCurrency(amount: number, currency = resolveDisplayCurrency()): string {
  const config = CurrencyFormatConfig[currency];
  const amountLabel = CurrencyNumberFormatters[currency].format(amount);

  return `${config.prefix}${amountLabel}${config.suffix}`;
}

export function formatChartAxisCurrency(amount: number): string {
  return formatKrwChartAxisCurrency(amount);
}

export function formatCurrencyNumber(amount: number, currency = resolveDisplayCurrency()): string {
  return CurrencyNumberFormatters[currency].format(amount);
}

function formatKrwChartAxisCurrency(amount: number): string {
  if (amount <= 0) {
    return "0";
  }

  for (let unitIndex = 0; unitIndex < KrwAxisUnits.length; unitIndex += 1) {
    const unit = KrwAxisUnits[unitIndex];
    if (amount < unit.divisor) {
      continue;
    }

    return `${KrwAxisNumberFormatter.format(amount / unit.divisor)}${unit.label}`;
  }

  return formatCurrencyNumber(amount, "KRW");
}
