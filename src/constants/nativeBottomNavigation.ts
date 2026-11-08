import { getAppScreenLabel } from "../lib/appScreenLabels";
import { AppMessages } from "./messages";
import { AssetCopy } from "./assets";

export const NativeBottomNavigationUi = { badgeDot: " " } as const;

export const NativeBottomNavigationTabs = [
  {
    screen: "calendar",
    label: AppMessages.calendarTab,
    symbol: "house",
    selectedSymbol: "house.fill",
    icon: "home-outline",
    selectedIcon: "home",
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
    screen: "assets",
    label: AssetCopy.title,
    symbol: "building.columns",
    selectedSymbol: "building.columns.fill",
    icon: "bank-outline",
    selectedIcon: "bank",
  },
  {
    screen: "all-menu",
    label: getAppScreenLabel("all-menu"),
    symbol: "line.3.horizontal",
    selectedSymbol: "line.3.horizontal",
    icon: "menu",
    selectedIcon: "menu",
  },
] as const;
