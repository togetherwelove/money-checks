import type { LedgerAppScreen } from "../types/app";

export type SignedInStackParamList = {
  account: undefined;
  "all-entries": undefined;
  calendar: undefined;
  charts: undefined;
  "contact-support": undefined;
  entry: undefined;
  help: undefined;
  "notification-settings": undefined;
  "open-source-licenses": undefined;
  share: undefined;
  subscription: undefined;
  support: undefined;
};

export function isSignedInStackScreen(value: string | undefined): value is LedgerAppScreen {
  if (!value) {
    return false;
  }

  return (
    value === "account" ||
    value === "all-entries" ||
    value === "calendar" ||
    value === "charts" ||
    value === "contact-support" ||
    value === "entry" ||
    value === "help" ||
    value === "notification-settings" ||
    value === "open-source-licenses" ||
    value === "share" ||
    value === "subscription" ||
    value === "support"
  );
}
