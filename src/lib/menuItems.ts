import { AnnualReportCopy } from "../constants/annualReport";
import { AllMenuCopy, AllMenuIcons } from "../constants/allMenu";
import { AppSettingsCopy } from "../constants/appSettings";
import { MenuCopy } from "../constants/menu";
import type { LedgerAppScreen } from "../types/app";
import type { CategoryIconName } from "../types/category";
import { getAppScreenLabel } from "./appScreenLabels";

export type AppMenuAction = "annual-report-download" | "manage-categories" | "contact-support";

type AppMenuItemDisplay = {
  icon?: CategoryIconName | typeof AllMenuIcons.excelExport;
  label: string;
  description?: string;
  disabled?: boolean;
  hasBadge?: boolean;
};

export type AppMenuNavigationItem = AppMenuItemDisplay & {
  targetScreen: Exclude<
    LedgerAppScreen,
    "all-entries" | "all-menu" | "calendar" | "charts" | "entry" | "assets"
  >;
};

export type AppMenuActionItem = AppMenuItemDisplay & {
  action: AppMenuAction;
};

export type AppMenuItem = AppMenuActionItem | AppMenuNavigationItem;

export type AppMenuSection = {
  keepTogether?: boolean;
  items: AppMenuItem[];
  label: string;
};

export function getAppMenuItemId(item: AppMenuItem): string {
  return "targetScreen" in item ? item.targetScreen : item.action;
}

export const AllMenuSubscriptionItem: AppMenuNavigationItem = {
  icon: "credit-card",
  label: getAppScreenLabel("subscription"),
  targetScreen: "subscription",
};

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
  const reportItems: AppMenuItem[] = [];
  if (options.showAnnualReportDownload) {
    reportItems.push({
      action: "annual-report-download",
      icon: AllMenuIcons.excelExport,
      label: AnnualReportCopy.headerAccessibilityLabel,
    });
  }

  return [
    {
      label: MenuCopy.sections.account,
      items: [...accountItems, ...ledgerItems],
      keepTogether: true,
    },
    ...(reportItems.length ? [{ label: MenuCopy.sections.ledger, items: reportItems }] : []),
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
          action: "contact-support",
        },
      ],
    },
  ];
}

export function groupAppMenuItems(items: AppMenuItem[], keepTogether = false) {
  if (keepTogether && items.length) {
    return [
      {
        key: getAppMenuItemId(items[0]),
        items,
        description: items.find((item) => item.description)?.description,
      },
    ];
  }
  const groups: { key: string; items: AppMenuItem[]; description?: string }[] = [];
  for (const item of items) {
    const previous = groups[groups.length - 1];
    if (!item.description && previous && !previous.description) previous.items.push(item);
    else groups.push({ key: getAppMenuItemId(item), items: [item], description: item.description });
  }
  return groups;
}
