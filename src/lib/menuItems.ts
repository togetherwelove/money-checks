import { AnnualReportCopy } from "../constants/annualReport";
import { AllMenuCopy } from "../constants/allMenu";
import { AppSettingsCopy } from "../constants/appSettings";
import { MenuCopy } from "../constants/menu";
import type { LedgerAppScreen } from "../types/app";
import type { CategoryIconName } from "../types/category";
import { getAppScreenLabel } from "./appScreenLabels";

export type AppMenuAction = "annual-report-download" | "manage-categories";

type AppMenuItemDisplay = {
  icon: CategoryIconName;
  label: string;
  description?: string;
  disabled?: boolean;
  hasBadge?: boolean;
};

export type AppMenuNavigationItem = AppMenuItemDisplay & {
  targetScreen: Exclude<
    LedgerAppScreen,
    "all-entries" | "all-menu" | "calendar" | "charts" | "entry"
  >;
};

export type AppMenuActionItem = AppMenuItemDisplay & {
  action: AppMenuAction;
};

export type AppMenuItem = AppMenuActionItem | AppMenuNavigationItem;

export type AppMenuSection = {
  items: AppMenuItem[];
  label: string;
};

export function getAppMenuItemId(item: AppMenuItem): string {
  return "targetScreen" in item ? item.targetScreen : item.action;
}

export function buildAllMenuSections(
  options: {
    showAnnualReportDownload?: boolean;
    activeBookName?: string;
    canManageCategories?: boolean;
    hasSharedLedgerNotifications?: boolean;
  } = {},
): AppMenuSection[] {
  const accountItems: AppMenuItem[] = [
    {
      icon: "user",
      label: AllMenuCopy.account,
      targetScreen: "account",
    },
  ];

  const ledgerItems: AppMenuItem[] = [
    {
      icon: "users",
      label: getAppScreenLabel("share"),
      targetScreen: "share",
      hasBadge: options.hasSharedLedgerNotifications,
    },
    {
      action: "manage-categories",
      icon: "grid",
      label: AppSettingsCopy.categoryModalTitle,
      description: options.canManageCategories
        ? `${AppSettingsCopy.categoryBookPrefix}${options.activeBookName ?? ""}`
        : AppSettingsCopy.categoryBookUnavailable,
      disabled: !options.canManageCategories,
    },
  ];
  if (options.showAnnualReportDownload) {
    ledgerItems.push({
      action: "annual-report-download",
      icon: "download",
      label: AnnualReportCopy.headerAccessibilityLabel,
    });
  }

  return [
    { label: MenuCopy.sections.account, items: accountItems },
    { label: MenuCopy.sections.ledger, items: ledgerItems },
    {
      label: MenuCopy.sections.settings,
      items: [
        { icon: "sliders", label: getAppScreenLabel("app-settings"), targetScreen: "app-settings" },
        {
          icon: "bell",
          label: getAppScreenLabel("notification-settings"),
          targetScreen: "notification-settings",
        },
      ],
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
          icon: "mail",
          label: getAppScreenLabel("contact-support"),
          targetScreen: "contact-support",
        },
      ],
    },
  ];
}
