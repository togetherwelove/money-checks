import { AppMessages } from "../constants/messages";
import { SubscriptionMessages } from "../constants/subscription";
import type { LedgerAppScreen } from "../types/app";

export type AppMenuItem = {
  icon: "bell" | "calendar" | "credit-card" | "edit-3" | "mail" | "user" | "users";
  label: string;
  targetScreen: Exclude<LedgerAppScreen, "charts">;
};

export function buildAppMenuItems(showNotificationSettings: boolean): AppMenuItem[] {
  const items: AppMenuItem[] = [
    {
      icon: "calendar",
      label: AppMessages.calendarTab,
      targetScreen: "calendar",
    },
    {
      icon: "edit-3",
      label: AppMessages.entryTab,
      targetScreen: "entry",
    },
    {
      icon: "users",
      label: AppMessages.menuShareTitle,
      targetScreen: "share",
    },
    {
      icon: "user",
      label: AppMessages.menuAccountTitle,
      targetScreen: "account",
    },
    {
      icon: "credit-card",
      label: SubscriptionMessages.menuTitle,
      targetScreen: "subscription",
    },
  ];

  if (showNotificationSettings) {
    items.push({
      icon: "bell",
      label: AppMessages.menuNotificationSettingsTitle,
      targetScreen: "notification-settings",
    });
  }

  items.push({
    icon: "mail",
    label: AppMessages.menuContactSupportTitle,
    targetScreen: "contact-support",
  });

  return items;
}
