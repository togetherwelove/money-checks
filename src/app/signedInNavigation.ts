import type { NavigatorScreenParams } from "@react-navigation/native";
import type { LedgerAppScreen } from "../types/app";

export type SignedInStackScreen = Exclude<LedgerAppScreen, "entry">;
export type PrimaryStackScreen = "calendar" | "all-entries" | "charts" | "share" | "app-settings";
export const PrimaryTabRoutes = {
  calendar: "calendar-tab",
  "all-entries": "entries-tab",
  charts: "charts-tab",
  share: "books-tab",
  "app-settings": "settings-tab",
} as const;
export type SignedInTabParamList = {
  "calendar-tab": NavigatorScreenParams<SignedInStackParamList> | undefined;
  "entries-tab": NavigatorScreenParams<SignedInStackParamList> | undefined;
  "charts-tab": NavigatorScreenParams<SignedInStackParamList> | undefined;
  "books-tab": NavigatorScreenParams<SignedInStackParamList> | undefined;
  "settings-tab": NavigatorScreenParams<SignedInStackParamList> | undefined;
};

export type SignedInStackParamList = {
  account: undefined;
  "all-entries": undefined;
  "app-settings": undefined;
  calendar: undefined;
  charts: undefined;
  "contact-support": undefined;
  "entry-sheet": { autoFocusContent?: boolean } | undefined;
  help: undefined;
  "help-faq": undefined;
  "notification-settings": undefined;
  subscription: undefined;
  share: undefined;
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
    value === "help-faq" ||
    value === "notification-settings" ||
    value === "subscription" ||
    value === "share" ||
    value === "support"
  );
}
