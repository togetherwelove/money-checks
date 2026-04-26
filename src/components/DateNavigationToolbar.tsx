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
};

export function DateNavigationToolbar({
  label,
  onMoveToCurrent,
  onPressLabel = null,
  spacing = "default",
  showMoveToCurrent = true,
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
    borderTopColor: AppColors.accent,
    borderTopWidth: 5,
    height: 0,
    marginTop: DateNavigationToolbarLayout.indicatorTopMargin,
    width: 0,
  },
  labelText: {
    color: AppColors.accent,
    fontSize: 18,
    fontWeight: "700",
  },
  currentButtonSlot: {
    width: DateNavigationToolbarLayout.defaultMinHeight,
    height: DateNavigationToolbarLayout.defaultMinHeight,
  },
});
