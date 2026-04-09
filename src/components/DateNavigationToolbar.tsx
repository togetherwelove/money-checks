import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { ICON_ACTION_BUTTON_SIZE, IconActionButton } from "./IconActionButton";

type DateNavigationToolbarProps = {
  label: string;
  onMoveToCurrent: () => void;
  onPressLabel?: (() => void) | null;
  showMoveToCurrent?: boolean;
};

export function DateNavigationToolbar({
  label,
  onMoveToCurrent,
  onPressLabel = null,
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
    <View style={styles.container}>
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
    minHeight: ICON_ACTION_BUTTON_SIZE,
    paddingVertical: 8,
    position: "relative",
  },
  labelButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  labelContent: {
    alignItems: "center",
    columnGap: 6,
    flexDirection: "row",
    justifyContent: "center",
  },
  labelIndicator: {
    borderLeftColor: "transparent",
    borderLeftWidth: 4,
    borderRightColor: "transparent",
    borderRightWidth: 4,
    borderTopColor: AppColors.accent,
    borderTopWidth: 5,
    height: 0,
    marginTop: 1,
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
    top: "50%",
    transform: [{ translateY: -ICON_ACTION_BUTTON_SIZE / 2 }],
  },
});
