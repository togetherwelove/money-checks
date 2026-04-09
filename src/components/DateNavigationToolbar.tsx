import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { ICON_ACTION_BUTTON_SIZE, IconActionButton } from "./IconActionButton";

type DateNavigationToolbarProps = {
  label: string;
  onMoveToCurrent: () => void;
  onPressLabel?: (() => void) | null;
};

export function DateNavigationToolbar({
  label,
  onMoveToCurrent,
  onPressLabel = null,
}: DateNavigationToolbarProps) {
  const labelNode = onPressLabel ? (
    <Pressable onPress={onPressLabel} style={styles.labelButton}>
      <Text style={styles.labelText}>{label}</Text>
    </Pressable>
  ) : (
    <View style={styles.labelButton}>
      <Text style={styles.labelText}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.leadingSpace} />
      {labelNode}
      <IconActionButton
        accessibilityLabel="오늘 날짜로 이동"
        icon="crosshair"
        onPress={onMoveToCurrent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  leadingSpace: {
    width: ICON_ACTION_BUTTON_SIZE,
  },
  labelButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
  },
  labelText: {
    color: AppColors.accent,
    fontSize: 18,
    fontWeight: "700",
  },
});
