import type { TFunction } from "i18next";

import type { LedgerAppScreen } from "../types/app";

export type FooterTabScreen = "all-entries" | "calendar" | "charts" | "entry" | "share";

type RegularFooterTabItem = {
  activeIcon: "book-open-page-variant" | "calendar-month" | "chart-pie" | "inbox" | "plus-circle";
  inactiveIcon:
    | "book-open-page-variant-outline"
    | "calendar-month-outline"
    | "chart-pie-outline"
    | "inbox-outline"
    | "plus-circle-outline";
  isPrimary?: false;
  label: string;
  targetScreen: Exclude<FooterTabScreen, "entry">;
};

type PrimaryFooterTabItem = {
  icon: "plus";
  isPrimary: true;
  label: string;
  targetScreen: "entry";
};

export type FooterTabItem = PrimaryFooterTabItem | RegularFooterTabItem;

const FooterTabLabelKeys: Record<FooterTabScreen, string> = {
  "all-entries": "footer.tabs.allEntries",
  calendar: "footer.tabs.calendar",
  charts: "footer.tabs.charts",
  entry: "footer.tabs.entry",
  share: "footer.tabs.export",
};

export function buildFooterTabs(t: TFunction): FooterTabItem[] {
  return [
    {
      activeIcon: "calendar-month",
      inactiveIcon: "calendar-month-outline",
      label: t(FooterTabLabelKeys.calendar),
      targetScreen: "calendar",
    },
    {
      activeIcon: "inbox",
      inactiveIcon: "inbox-outline",
      label: t(FooterTabLabelKeys["all-entries"]),
      targetScreen: "all-entries",
    },
    {
      icon: "plus",
      isPrimary: true,
      label: t(FooterTabLabelKeys.entry),
      targetScreen: "entry",
    },
    {
      activeIcon: "chart-pie",
      inactiveIcon: "chart-pie-outline",
      label: t(FooterTabLabelKeys.charts),
      targetScreen: "charts",
    },
    {
      activeIcon: "book-open-page-variant",
      inactiveIcon: "book-open-page-variant-outline",
      label: t(FooterTabLabelKeys.share),
      targetScreen: "share",
    },
  ];
}

export function isFooterTabScreen(screen: LedgerAppScreen): screen is FooterTabScreen {
  return (
    screen === "calendar" ||
    screen === "all-entries" ||
    screen === "entry" ||
    screen === "charts" ||
    screen === "share"
  );
}
