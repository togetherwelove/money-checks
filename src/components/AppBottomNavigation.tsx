import { StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "./AppIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppColors } from "../constants/colors";
import { buildFooterTabs } from "../lib/footerTabs";
import { AppLayout } from "../constants/layout";
import { AppMessages } from "../constants/messages";
import { FooterTabBarUi } from "../constants/menu";
import { NativeBottomNavigationUi } from "../constants/nativeBottomNavigation";
import type { AppBottomNavigationProps } from "./AppBottomNavigation.types";
import { IconActionButton } from "./IconActionButton";
import { AppFooterTabBar } from "./AppFooterTabBar";

const tabs = buildFooterTabs().filter(tab =>
  tab.targetScreen !== "share" && !tab.isPrimary);

export function AppBottomNavigation({ activeScreen, badges, disabled, onSelect, onLayout }: AppBottomNavigationProps) {
  const insets = useSafeAreaInsets();
  const selected = tabs.find(tab => tab.targetScreen === activeScreen)?.targetScreen ?? null;
  return <View onLayout={onLayout} style={[styles.root, { paddingBottom: insets.bottom }]}>
    <View style={styles.tabs}><AppFooterTabBar activeScreen={selected} badgedScreens={badges} tabs={tabs}
      isPrimaryActionDisabled={disabled}
      onSelectTab={screen => { if (!disabled) onSelect(screen); }} /></View>
    <IconActionButton icon="plus" accessibilityLabel={AppMessages.entryScreenTitle}
      iconContent={<MaterialCommunityIcons name={NativeBottomNavigationUi.addIcon} size={FooterTabBarUi.iconSize} color={AppColors.mutedText} />}
      disabled={disabled} onPress={() => { if (!disabled) onSelect("entry"); }} />
  </View>;
}

const styles = StyleSheet.create({
  root: { flexDirection: "row", alignItems: "center", paddingRight: AppLayout.compactGap, backgroundColor: AppColors.screenBackground },
  tabs: { flex: 1 },
});
