import { NativeModules } from "react-native";

import type { LedgerWidgetSummary } from "../types/widget";

type MoneyChecksWidgetModule = {
  clearSummary: () => Promise<void>;
  updateSummary: (summary: LedgerWidgetSummary) => Promise<void>;
};

const moneyChecksWidget = NativeModules.MoneyChecksWidget as MoneyChecksWidgetModule | undefined;

export async function clearLedgerWidgetSummary(): Promise<void> {
  await moneyChecksWidget?.clearSummary();
}

export async function updateLedgerWidgetSummary(summary: LedgerWidgetSummary): Promise<void> {
  await moneyChecksWidget?.updateSummary(summary);
}
