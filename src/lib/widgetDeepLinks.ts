import { LedgerWidgetDeepLinks } from "../constants/widget";

export type LedgerWidgetDeepLinkAction = "clipboard" | "entry";

export function resolveLedgerWidgetDeepLinkAction(
  url: string | null | undefined,
): LedgerWidgetDeepLinkAction | null {
  if (!url) {
    return null;
  }

  if (url === LedgerWidgetDeepLinks.clipboard) {
    return "clipboard";
  }

  if (url === LedgerWidgetDeepLinks.entry) {
    return "entry";
  }

  return null;
}
