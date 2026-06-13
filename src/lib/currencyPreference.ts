import { type AppCurrency, DefaultCurrency } from "../constants/currency";

export function resolveDisplayCurrency(): AppCurrency {
  return DefaultCurrency;
}
