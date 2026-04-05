import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { IconActionButton } from "./IconActionButton";

type DateNavigationToolbarProps = {
  label: string;
  onMoveNext: () => void;
  onMovePrevious: () => void;
  onMoveToCurrent: () => void;
  onPressLabel: () => void;
};

export function DateNavigationToolbar({
  label,
  onMoveNext,
  onMovePrevious,
  onMoveToCurrent,
  onPressLabel,
}: DateNavigationToolbarProps) {
  return (
    <View style={styles.container}>
      <Pressable onPress={onPressLabel} style={styles.labelButton}>
        <Text style={styles.labelText}>{label}</Text>
      </Pressable>
      <View style={styles.actions}>
        <IconActionButton icon="chevron-left" onPress={onMovePrevious} />
        <IconActionButton icon="clock" onPress={onMoveToCurrent} />
        <IconActionButton icon="chevron-right" onPress={onMoveNext} />
      </View>
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
  labelButton: {
    flex: 1,
    paddingVertical: 6,
  },
  labelText: {
    color: AppColors.accent,
    fontSize: 14,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
});
