import type { LedgerAppScreen } from "../types/app";

export type SignedInStackScreen = Exclude<LedgerAppScreen, "entry">;

export type SignedInStackParamList = {
  account: undefined;
  "all-entries": undefined;
  "app-settings": undefined;
  calendar: undefined;
  charts: undefined;
  "contact-support": undefined;
  "entry-sheet": { autoFocusContent?: boolean } | undefined;
  help: undefined;
  "notification-settings": undefined;
  share: undefined;
  subscription: undefined;
  support: undefined;
};

export function isSignedInStackScreen(value: string | undefined): value is SignedInStackScreen {
  if (!value) {
    return false;
  }

  return (
    value === "account" ||
    value === "all-entries" ||
    value === "app-settings" ||
    value === "calendar" ||
    value === "charts" ||
    value === "contact-support" ||
    value === "help" ||
    value === "notification-settings" ||
    value === "share" ||
    value === "subscription" ||
    value === "support"
  );
}
