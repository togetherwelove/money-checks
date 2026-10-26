import { Feather } from "./AppIcons";
import { Pressable, StyleSheet, View } from "react-native";

import { AppColors } from "../constants/colors";
import { EntryComposerCopy } from "../constants/entryComposer";
import { FooterTabBarUi, MenuUi } from "../constants/menu";

export function AppHeaderBookMenu({ bookName, hasBadge, disabled, onSwitch }: {
  bookName?: string; hasBadge: boolean; disabled: boolean; onSwitch: () => void;
}) {
  return (
    <Pressable disabled={disabled} onPress={onSwitch} accessibilityRole="button"
      accessibilityLabel={`${EntryComposerCopy.book}${bookName ? `: ${bookName}` : ""}`}
      style={styles.button}>
      <Feather name="book-open" size={MenuUi.floatingButtonIconSize} color={AppColors.text} />
      {hasBadge ? <View style={styles.badge} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: { position: "absolute", top: MenuUi.floatingButtonVerticalInset, right: MenuUi.floatingButtonInset,
    width: FooterTabBarUi.badgeDotSize, height: FooterTabBarUi.badgeDotSize,
    borderRadius: FooterTabBarUi.badgeDotSize, backgroundColor: AppColors.primary },
  button: { width: MenuUi.floatingButtonSize, height: MenuUi.floatingButtonSize,
    alignItems: "center", justifyContent: "center" },
});
