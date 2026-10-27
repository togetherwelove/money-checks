import { getAppScreenLabel } from "../lib/appScreenLabels";
import { AppMessages } from "./messages";

export const NativeBottomNavigationUi = { badgeDot: " " } as const;

export const NativeBottomNavigationTabs = [
  {
    screen: "calendar",
    label: AppMessages.calendarTab,
    symbol: "calendar",
    selectedSymbol: "calendar",
    icon: "calendar-month-outline",
    selectedIcon: "calendar-month",
  },
  {
    screen: "all-entries",
    label: AppMessages.allEntriesTitle,
    symbol: "tray.full",
    selectedSymbol: "tray.full.fill",
    icon: "inbox-outline",
    selectedIcon: "inbox",
  },
  {
    screen: "charts",
    label: AppMessages.chartScreenTitle,
    symbol: "chart.pie",
    selectedSymbol: "chart.pie.fill",
    icon: "chart-pie-outline",
    selectedIcon: "chart-pie",
  },
  {
    screen: "all-menu",
    label: getAppScreenLabel("all-menu"),
    symbol: "square.grid.2x2",
    selectedSymbol: "square.grid.2x2.fill",
    icon: "view-grid-outline",
    selectedIcon: "view-grid",
  },
] as const;
