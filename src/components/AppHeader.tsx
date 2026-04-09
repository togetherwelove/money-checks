import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { IconActionButton } from "./IconActionButton";

type AppHeaderProps = {
  isMenuOpen?: boolean;
  leadingAction?: ReactNode;
  onOpenMenu: () => void;
  onPressCenterLabel?: (() => void) | null;
  showsCenterLabelIndicator?: boolean;
  titleLabel?: string | null;
  yearLabel?: string | null;
};

export function AppHeader({
  isMenuOpen = false,
  leadingAction = null,
  onOpenMenu,
  onPressCenterLabel = null,
  showsCenterLabelIndicator = false,
  titleLabel = null,
  yearLabel = null,
}: AppHeaderProps) {
  const centerLabel = yearLabel ?? titleLabel;
  const isCenterLabelPressable = Boolean(centerLabel && onPressCenterLabel);

  return (
    <View style={styles.container}>
      <View style={styles.sideSlot}>{leadingAction}</View>
      <View style={styles.titleSlot}>
        {isCenterLabelPressable ? (
          <Pressable onPress={onPressCenterLabel} style={styles.titleButton}>
            <Text style={styles.titleText}>{centerLabel}</Text>
            {showsCenterLabelIndicator ? <View style={styles.titleIndicator} /> : null}
          </Pressable>
        ) : centerLabel ? (
          <Text style={styles.titleText}>{centerLabel}</Text>
        ) : null}
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
  titleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  titleText: {
    color: AppColors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  titleIndicator: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 5,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: AppColors.mutedText,
    marginTop: 1,
  },
});
