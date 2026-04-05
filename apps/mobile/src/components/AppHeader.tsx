import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { IconActionButton } from "./IconActionButton";

type AppHeaderProps = {
  isMenuOpen?: boolean;
  leadingAction?: ReactNode;
  onOpenMenu: () => void;
  titleLabel?: string | null;
  yearLabel?: string | null;
};

export function AppHeader({
  isMenuOpen = false,
  leadingAction = null,
  onOpenMenu,
  titleLabel = null,
  yearLabel = null,
}: AppHeaderProps) {
  const centerLabel = yearLabel ?? titleLabel;

  return (
    <View style={styles.container}>
      <View style={styles.sideSlot}>{leadingAction}</View>
      <View pointerEvents="none" style={styles.titleSlot}>
        {centerLabel ? <Text style={styles.titleText}>{centerLabel}</Text> : null}
      </View>
      <View style={[styles.sideSlot, styles.menuSlot]}>
        <IconActionButton icon="menu" isActive={isMenuOpen} onPress={onOpenMenu} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 60,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  sideSlot: {
    width: 104,
    justifyContent: "center",
  },
  menuSlot: {
    alignItems: "flex-end",
  },
  titleSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  titleText: {
    color: AppColors.text,
    fontSize: 18,
    fontWeight: "800",
  },
});
