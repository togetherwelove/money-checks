import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import {
  DateNavigationToolbarCopy,
  DateNavigationToolbarLayout,
} from "../constants/dateNavigationToolbar";
import { IconActionButton } from "./IconActionButton";

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
            accessibilityLabel={DateNavigationToolbarCopy.moveToTodayAccessibilityLabel}
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
    gap: DateNavigationToolbarLayout.labelGap,
    minHeight: DateNavigationToolbarLayout.defaultMinHeight,
    paddingBottom: DateNavigationToolbarLayout.defaultBottomPadding,
    paddingTop: DateNavigationToolbarLayout.defaultTopPadding,
  },
  compactBottomContainer: {
    paddingBottom: DateNavigationToolbarLayout.compactBottomPadding,
  },
  labelButton: {
    alignItems: "flex-start",
    flexShrink: 1,
    justifyContent: "center",
  },
  labelContent: {
    alignItems: "center",
    columnGap: DateNavigationToolbarLayout.labelGap,
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  labelIndicator: {
    borderLeftColor: "transparent",
    borderLeftWidth: DateNavigationToolbarLayout.indicatorSize,
    borderRightColor: "transparent",
    borderRightWidth: DateNavigationToolbarLayout.indicatorSize,
    borderTopColor: AppColors.text,
    borderTopWidth: 5,
    height: 0,
    marginTop: DateNavigationToolbarLayout.indicatorTopMargin,
    width: 0,
  },
  labelText: {
    color: AppColors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  currentButtonSlot: {
    width: DateNavigationToolbarLayout.defaultMinHeight,
    height: DateNavigationToolbarLayout.defaultMinHeight,
  },
  trailingSlot: {
    marginLeft: "auto",
  },
});
