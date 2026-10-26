import { MenuView } from "@react-native-menu/menu";
import { Feather } from "./AppIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { EntryComposerCopy as Copy, EntryComposerUi } from "../constants/entryComposer";
import { AppLayout } from "../constants/layout";
import { MenuUi } from "../constants/menu";
import { OneLineTextFitProps } from "../constants/textLayout";
import type { FooterTabScreen } from "../lib/footerTabs";

const tabs = [
  { screen: "calendar", label: Copy.calendar },
  { screen: "all-entries", label: Copy.entries },
  { screen: "charts", label: Copy.charts },
] as const;
const bookActions = [{ id: "switch", title: Copy.switchBook }, { id: "manage", title: Copy.manageBook }];

export function AppTopNavigation({ activeScreen, badges, bookName, disabled, onSelect, onSwitchBook }: {
  activeScreen: string; badges: FooterTabScreen[]; bookName?: string; disabled: boolean;
  onSelect: (screen: FooterTabScreen) => void; onSwitchBook: () => void;
}) {
  return <View style={styles.bar}>
    {tabs.map(({ screen, label }) => <Pressable key={screen} accessibilityRole="tab" accessibilityState={{ selected: activeScreen === screen }}
      disabled={disabled} style={styles.tab} onPress={() => onSelect(screen)}>
      <Text {...OneLineTextFitProps} style={[styles.text, activeScreen === screen && styles.active]}>{label}{badges.includes(screen) ? Copy.badge : ""}</Text>
    </Pressable>)}
    <MenuView style={styles.bookTab} actions={bookActions} onPressAction={({ nativeEvent }) => { if (!disabled) { if (nativeEvent.event === "switch") onSwitchBook(); else onSelect("share"); } }}>
      <Pressable disabled={disabled} accessibilityRole="button" accessibilityLabel={Copy.book} style={[styles.tab, styles.bookButton]}>
        <Text numberOfLines={1} style={[styles.text, styles.bookName]}>{bookName || Copy.book}{badges.includes("share") ? Copy.badge : ""}</Text>
        <Feather name="chevron-down" size={EntryComposerUi.bookDropdownIconSize} color={AppColors.mutedText} />
      </Pressable>
    </MenuView>
  </View>;
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", minHeight: MenuUi.floatingButtonSize + MenuUi.floatingButtonVerticalInset * 2, backgroundColor: AppColors.surface, paddingLeft: AppLayout.screenPadding, paddingRight: MenuUi.floatingButtonReservedWidth + MenuUi.floatingButtonInset, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: AppColors.border },
  bookTab: { flex: 1, minWidth: 0 },
  bookButton: { flexDirection: "row", alignItems: "center", justifyContent: "flex-start", gap: AppLayout.compactGap },
  bookName: { flexShrink: 1 },
  tab: { minHeight: EntryComposerUi.fieldHeight, minWidth: 0, flexShrink: 1, justifyContent: "center", paddingHorizontal: AppLayout.cardGap, maxWidth: EntryComposerUi.bookTabMaxWidth },
  text: { fontSize: EntryComposerUi.fontSize, color: AppColors.mutedText },
  active: { color: AppColors.primary, fontWeight: "700" },
});
