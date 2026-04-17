import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { DateNavigationToolbarLayout } from "../constants/dateNavigationToolbar";
import { ICON_ACTION_BUTTON_SIZE, IconActionButton } from "./IconActionButton";

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
      {showMoveToCurrent ? (
        <View style={styles.trailingButton}>
          <IconActionButton
            accessibilityLabel="오늘 날짜로 이동"
            icon="crosshair"
            onPress={onMoveToCurrent}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: DateNavigationToolbarLayout.defaultBottomPadding,
    paddingTop: DateNavigationToolbarLayout.defaultTopPadding,
    position: "relative",
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
  trailingButton: {
    position: "absolute",
    right: 0,
    top: "100%",
    transform: [{ translateY: -ICON_ACTION_BUTTON_SIZE / 2 }],
  },
});
