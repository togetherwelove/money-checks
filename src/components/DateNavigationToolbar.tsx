import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { ICON_ACTION_BUTTON_COMPACT_SIZE, IconActionButton } from "./IconActionButton";

type DateNavigationToolbarProps = {
  label: string;
  onMoveToCurrent: () => void;
  onPressLabel?: (() => void) | null;
  spacing?: "compactBottom" | "default";
  showMoveToCurrent?: boolean;
  trailing?: ReactNode;
};

export function DateNavigationToolbar({
  label,
  onMoveToCurrent,
  onPressLabel = null,
  spacing = "default",
  showMoveToCurrent = true,
  trailing = null,
}: DateNavigationToolbarProps) {
  const labelNode = onPressLabel ? (
    <Pressable onPress={onPressLabel} style={styles.labelButton}>
      <View style={styles.labelContent}>
        <Text style={styles.labelText}>{label}</Text>
        <View style={styles.labelIndicator} />
      </View>
    </Pressable>
  ) : (
    <View style={styles.labelButton}>
      <Text style={styles.labelText}>{label}</Text>
    </View>
  );

  return (
    <View
      style={[styles.container, spacing === "compactBottom" ? styles.compactBottomContainer : null]}
    >
      {labelNode}
      <View style={styles.currentButtonSlot}>
        {showMoveToCurrent ? (
          <IconActionButton
            accessibilityLabel="오늘 날짜로 이동"
            icon="crosshair"
            onPress={onMoveToCurrent}
            size="compact"
          />
        ) : null}
      </View>
      {trailing ? <View style={styles.trailingSlot}>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    minHeight: ICON_ACTION_BUTTON_COMPACT_SIZE,
    paddingBottom: 8,
    paddingTop: 8,
  },
  compactBottomContainer: {
    paddingBottom: 2,
  },
  labelButton: {
    alignItems: "flex-start",
    flexShrink: 1,
    justifyContent: "center",
  },
  labelContent: {
    alignItems: "center",
    columnGap: 6,
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  labelIndicator: {
    borderLeftColor: "transparent",
    borderLeftWidth: 4,
    borderRightColor: "transparent",
    borderRightWidth: 4,
    borderTopColor: AppColors.text,
    borderTopWidth: 5,
    height: 0,
    marginTop: 1,
    width: 0,
  },
  labelText: {
    color: AppColors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  currentButtonSlot: {
    width: ICON_ACTION_BUTTON_COMPACT_SIZE,
    height: ICON_ACTION_BUTTON_COMPACT_SIZE,
  },
  trailingSlot: {
    marginLeft: "auto",
  },
});
