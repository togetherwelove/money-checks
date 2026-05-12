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

const COMPACT_CURRENCY_MAXIMUM_FRACTION_DIGITS = 1;
const KRW_AXIS_UNIT_ROLLOVER_COUNT = 10;

const KrwAxisUnits = [
  { divisor: 10_000_000, label: "천만" },
  { divisor: 1_000_000, label: "백만" },
  { divisor: 100_000, label: "십만" },
  { divisor: 10_000, label: "만" },
  { divisor: 1_000, label: "천" },
] as const;

const CompactCurrencyNumberFormatters = Object.fromEntries(
  Object.entries(CurrencyFormatConfig).map(([currency, config]) => [
    currency,
    new Intl.NumberFormat(config.locale, {
      compactDisplay: "short",
      maximumFractionDigits: COMPACT_CURRENCY_MAXIMUM_FRACTION_DIGITS,
      notation: "compact",
    }),
  ]),
) as Record<AppCurrency, Intl.NumberFormat>;

export function formatCurrency(amount: number, currency = resolveDisplayCurrency()): string {
  const config = CurrencyFormatConfig[currency];
  const amountLabel = CurrencyNumberFormatters[currency].format(amount);

  return `${config.prefix}${amountLabel}${config.suffix}`;
}

export function formatCompactCurrency(amount: number, currency = resolveDisplayCurrency()): string {
  const config = CurrencyFormatConfig[currency];
  const amountLabel = CompactCurrencyNumberFormatters[currency].format(amount);

  return `${config.prefix}${amountLabel}${config.suffix}`;
}

export function formatChartAxisCurrency(
  amount: number,
  currency = resolveDisplayCurrency(),
): string {
  if (currency === "KRW") {
    return formatKrwChartAxisCurrency(amount);
  }

  return formatCompactCurrency(amount, currency);
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

    const roundedUnitCount = Math.round(amount / unit.divisor);
    const nextUnit = KrwAxisUnits[unitIndex - 1];
    if (nextUnit && roundedUnitCount >= KRW_AXIS_UNIT_ROLLOVER_COUNT) {
      return `${Math.round(amount / nextUnit.divisor)}${nextUnit.label}`;
    }

    return `${roundedUnitCount}${unit.label}`;
  }

  return formatCurrencyNumber(amount, "KRW");
}
