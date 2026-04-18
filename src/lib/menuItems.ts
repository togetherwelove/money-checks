import type { LedgerAppScreen } from "../types/app";
import { getAppScreenLabel } from "./appScreenLabels";

export type AppMenuItem = {
  icon: "bell" | "calendar" | "credit-card" | "edit-3" | "mail" | "user" | "users";
  label: string;
  targetScreen: Exclude<LedgerAppScreen, "charts">;
};

export function buildAppMenuItems(showNotificationSettings: boolean): AppMenuItem[] {
  const items: AppMenuItem[] = [
    {
      icon: "calendar",
      label: getAppScreenLabel("calendar"),
      targetScreen: "calendar",
    },
    {
      icon: "edit-3",
      label: getAppScreenLabel("entry"),
      targetScreen: "entry",
    },
    {
      icon: "users",
      label: getAppScreenLabel("share"),
      targetScreen: "share",
    },
    {
      icon: "user",
      label: getAppScreenLabel("account"),
      targetScreen: "account",
    },
    {
      icon: "credit-card",
      label: getAppScreenLabel("subscription"),
      targetScreen: "subscription",
    },
  ];

  if (showNotificationSettings) {
    items.push({
      icon: "bell",
      label: getAppScreenLabel("notification-settings"),
      targetScreen: "notification-settings",
    });
  }

  items.push({
    icon: "mail",
    label: getAppScreenLabel("contact-support"),
    targetScreen: "contact-support",
  });

  return items;
}
