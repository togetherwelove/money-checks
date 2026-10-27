import { NativeBottomNavigationTabs } from "../constants/nativeBottomNavigation";
import type { LedgerAppScreen } from "../types/app";

type Destination = (typeof NativeBottomNavigationTabs)[number];
export type FooterTabScreen = Destination["screen"];
export type FooterTabItem = {
  activeIcon: Destination["selectedIcon"];
  inactiveIcon: Destination["icon"];
  label: string;
  targetScreen: FooterTabScreen;
};

export function buildFooterTabs(): FooterTabItem[] {
  return NativeBottomNavigationTabs.map((tab) => ({
    activeIcon: tab.selectedIcon,
    inactiveIcon: tab.icon,
    label: tab.label,
    targetScreen: tab.screen,
  }));
}

export function isFooterTabScreen(screen: LedgerAppScreen): screen is FooterTabScreen {
  return NativeBottomNavigationTabs.some((tab) => tab.screen === screen);
}
