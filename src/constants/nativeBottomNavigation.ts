import { AppMessages } from "./messages";

export const NativeBottomNavigationUi = {
  addIcon: "plus",
  badgeDot: " ",
} as const;

export const NativeBottomNavigationTabs = [
  { screen: "calendar", label: AppMessages.calendarTab, symbol: "calendar", selectedSymbol: "calendar", icon: "calendar-month-outline", selectedIcon: "calendar-month" },
  { screen: "all-entries", label: AppMessages.allEntriesTitle, symbol: "tray.full", selectedSymbol: "tray.full.fill", icon: "inbox-outline", selectedIcon: "inbox" },
  { screen: "charts", label: AppMessages.chartScreenTitle, symbol: "chart.pie", selectedSymbol: "chart.pie.fill", icon: "chart-pie-outline", selectedIcon: "chart-pie" },
] as const;

