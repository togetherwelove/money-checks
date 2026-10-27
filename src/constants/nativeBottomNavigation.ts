import { getAppScreenLabel } from "../lib/appScreenLabels";
import { AppMessages } from "./messages";

export const NativeBottomNavigationUi = {
  addIcon: "plus",
  badgeDot: " ",
} as const;

export const NativeBottomNavigationTabs = [
  { screen: "calendar", label: AppMessages.calendarTab, symbol: "calendar", selectedSymbol: "calendar", icon: "calendar-month-outline", selectedIcon: "calendar-month" },
  { screen: "all-entries", label: AppMessages.allEntriesTitle, symbol: "tray.full", selectedSymbol: "tray.full.fill", icon: "inbox-outline", selectedIcon: "inbox" },
  { screen: "charts", label: AppMessages.chartScreenTitle, symbol: "chart.pie", selectedSymbol: "chart.pie.fill", icon: "chart-pie-outline", selectedIcon: "chart-pie" },
  { screen: "share", label: getAppScreenLabel("share"), symbol: "books.vertical", selectedSymbol: "books.vertical.fill", icon: "book-open-page-variant-outline", selectedIcon: "book-open-page-variant" },
  { screen: "app-settings", label: getAppScreenLabel("app-settings"), symbol: "gearshape", selectedSymbol: "gearshape.fill", icon: "cog-outline", selectedIcon: "cog" },
] as const;

