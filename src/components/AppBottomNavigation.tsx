import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppColors } from "../constants/colors";
import { FooterTabBarUi } from "../constants/menu";
import { buildFooterTabs } from "../lib/footerTabs";
import type { AppBottomNavigationProps } from "./AppBottomNavigation.types";
import { AppFooterTabBar } from "./AppFooterTabBar";

const tabs = buildFooterTabs();

export function AppBottomNavigation({
  activeScreen,
  badges,
  disabled,
  onSelect,
  onLayout,
}: AppBottomNavigationProps) {
  const insets = useSafeAreaInsets();
  const selected = tabs.find((tab) => tab.targetScreen === activeScreen)?.targetScreen ?? null;
  return (
    <View onLayout={onLayout} style={[styles.root, { paddingBottom: insets.bottom }]}>
      <View style={styles.tabs}>
        <AppFooterTabBar
          activeScreen={selected}
          badgedScreens={badges}
          tabs={tabs}
          disabled={disabled}
          onSelectTab={(screen) => {
            if (!disabled) onSelect(screen);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.screenBackground,
    paddingHorizontal: FooterTabBarUi.barHorizontalInset,
  },
  tabs: { flex: 1 },
});
