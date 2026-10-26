import type { LayoutChangeEvent } from "react-native";
import type { FooterTabScreen } from "../lib/footerTabs";
import type { LedgerAppScreen } from "../types/app";

export type AppBottomNavigationProps = {
  activeScreen: LedgerAppScreen;
  badges: FooterTabScreen[];
  disabled: boolean;
  onSelect: (screen: FooterTabScreen) => void;
  onLayout?: (event: LayoutChangeEvent) => void;
};
