import { AppScheme } from "./appScheme";

export const LedgerWidgetConfig = {
  maxRecentEntries: 2,
} as const;

export const LedgerWidgetDeepLinks = {
  clipboard: `${AppScheme}://widget/clipboard`,
  entry: `${AppScheme}://widget/entry`,
} as const;
