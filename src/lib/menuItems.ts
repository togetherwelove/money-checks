import { AnnualReportCopy } from "../constants/annualReport";
import { MenuCopy } from "../constants/menu";
import type { LedgerAppScreen } from "../types/app";
import { getAppScreenLabel } from "./appScreenLabels";

export type AppMenuAction = "annual-report-download";

export type AppMenuNavigationItem = {
  icon: "credit-card" | "gift" | "help-circle" | "mail" | "settings" | "user";
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
  options: {
    showAnnualReportDownload?: boolean;
  } = {},
): AppMenuSection[] {
  const accountItems: AppMenuItem[] = [
    {
      icon: "user",
      label: getAppScreenLabel("account"),
      targetScreen: "account",
    },
    {
      icon: "settings",
      label: getAppScreenLabel("app-settings"),
      targetScreen: "app-settings",
    },
  ];

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
            label: MenuCopy.sections.ledger,
            items: ledgerItems,
          },
        ]
      : []),
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
          icon: "mail",
          label: getAppScreenLabel("contact-support"),
          targetScreen: "contact-support",
        },
      ],
    },
    {
      label: MenuCopy.sections.account,
      items: accountItems,
    },
  ];
}
