import { AppMessages } from "../constants/messages";
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

export function buildFooterTabs(): FooterTabItem[] {
  return [
    {
      activeIcon: "calendar-month",
      inactiveIcon: "calendar-month-outline",
      label: AppMessages.calendarTab,
      targetScreen: "calendar",
    },
    {
      activeIcon: "inbox",
      inactiveIcon: "inbox-outline",
      label: "전체 내역",
      targetScreen: "all-entries",
    },
    {
      icon: "plus",
      isPrimary: true,
      label: AppMessages.entryScreenTitle,
      targetScreen: "entry",
    },
    {
      activeIcon: "chart-pie",
      inactiveIcon: "chart-pie-outline",
      label: AppMessages.chartScreenTitle,
      targetScreen: "charts",
    },
    {
      activeIcon: "book-open-page-variant",
      inactiveIcon: "book-open-page-variant-outline",
      label: AppMessages.shareTitle,
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
