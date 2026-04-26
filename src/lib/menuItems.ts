import { MenuCopy } from "../constants/menu";
import type { LedgerAppScreen } from "../types/app";
import { getAppScreenLabel } from "./appScreenLabels";

export type AppMenuItem = {
  icon:
    | "bell"
    | "calendar"
    | "credit-card"
    | "edit-3"
    | "gift"
    | "help-circle"
    | "file-text"
    | "mail"
    | "user"
    | "users";
  label: string;
  targetScreen: Exclude<LedgerAppScreen, "charts">;
};

export type AppMenuSection = {
  items: AppMenuItem[];
  label: string;
};

export function buildAppMenuSections(showNotificationSettings: boolean): AppMenuSection[] {
  const accountItems: AppMenuItem[] = [
    {
      icon: "user",
      label: getAppScreenLabel("account"),
      targetScreen: "account",
    },
  ];

  if (showNotificationSettings) {
    accountItems.push({
      icon: "bell",
      label: getAppScreenLabel("notification-settings"),
      targetScreen: "notification-settings",
    });
  }

  return [
    {
      label: MenuCopy.sections.ledger,
      items: [
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
      ],
    },
    {
      label: MenuCopy.sections.account,
      items: accountItems,
    },
    {
      label: MenuCopy.sections.support,
      items: [
        {
          icon: "credit-card",
          label: getAppScreenLabel("subscription"),
          targetScreen: "subscription",
        },
        {
          icon: "gift",
          label: getAppScreenLabel("support"),
          targetScreen: "support",
        },
        {
          icon: "help-circle",
          label: getAppScreenLabel("help"),
          targetScreen: "help",
        },
        {
          icon: "file-text",
          label: getAppScreenLabel("open-source-licenses"),
          targetScreen: "open-source-licenses",
        },
        {
          icon: "mail",
          label: getAppScreenLabel("contact-support"),
          targetScreen: "contact-support",
        },
      ],
    },
  ];
}
