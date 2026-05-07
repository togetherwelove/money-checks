import type { TFunction } from "i18next";

import { AnnualReportCopy } from "../constants/annualReport";
import { MenuCopy } from "../constants/menu";
import type { LedgerAppScreen } from "../types/app";
import { getAppScreenLabel } from "./appScreenLabels";

export type AppMenuAction = "annual-report-download";

export type AppMenuNavigationItem = {
  icon: "bell" | "credit-card" | "gift" | "help-circle" | "mail" | "user";
  label: string;
  targetScreen: Exclude<LedgerAppScreen, "all-entries" | "calendar" | "charts" | "entry" | "share">;
};

export type AppMenuActionItem = {
  action: AppMenuAction;
  icon: "download";
  label: string;
};

export type AppMenuItem = AppMenuActionItem | AppMenuNavigationItem;

export type AppMenuSection = {
  items: AppMenuItem[];
  label: string;
};

export function buildAppMenuSections(
  showNotificationSettings: boolean,
  t?: TFunction,
  options: {
    showAnnualReportDownload?: boolean;
  } = {},
): AppMenuSection[] {
  const accountItems: AppMenuItem[] = [
    {
      icon: "user",
      label: getAppScreenLabel("account", t),
      targetScreen: "account",
    },
  ];

  if (showNotificationSettings) {
    accountItems.push({
      icon: "bell",
      label: getAppScreenLabel("notification-settings", t),
      targetScreen: "notification-settings",
    });
  }

  const ledgerItems: AppMenuItem[] = options.showAnnualReportDownload
    ? [
        {
          action: "annual-report-download",
          icon: "download",
          label: AnnualReportCopy.headerAccessibilityLabel,
        },
      ]
    : [];

  return [
    ...(ledgerItems.length > 0
      ? [
          {
            label: t?.("menu.sections.ledger") ?? MenuCopy.sections.ledger,
            items: ledgerItems,
          },
        ]
      : []),
    {
      label: t?.("menu.sections.support") ?? MenuCopy.sections.support,
      items: [
        {
          icon: "credit-card",
          label: getAppScreenLabel("subscription", t),
          targetScreen: "subscription",
        },
        {
          icon: "gift",
          label: getAppScreenLabel("support", t),
          targetScreen: "support",
        },
        {
          icon: "help-circle",
          label: getAppScreenLabel("help", t),
          targetScreen: "help",
        },
        {
          icon: "mail",
          label: getAppScreenLabel("contact-support", t),
          targetScreen: "contact-support",
        },
      ],
    },
    {
      label: t?.("menu.sections.account") ?? MenuCopy.sections.account,
      items: accountItems,
    },
  ];
}
