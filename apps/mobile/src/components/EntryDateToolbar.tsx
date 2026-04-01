import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { IconActionButton } from "./IconActionButton";

type EntryDateToolbarProps = {
  dateLabel: string;
  onMoveNextDay: () => void;
  onMovePreviousDay: () => void;
  onMoveToToday: () => void;
};

export function EntryDateToolbar({
  dateLabel,
  onMoveNextDay,
  onMovePreviousDay,
  onMoveToToday,
}: EntryDateToolbarProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.dateLabel}>{dateLabel}</Text>
      <View style={styles.actions}>
        <IconActionButton icon="chevron-left" onPress={onMovePreviousDay} />
        <IconActionButton icon="clock" onPress={onMoveToToday} />
        <IconActionButton icon="chevron-right" onPress={onMoveNextDay} />
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
  dateLabel: {
    color: AppColors.accent,
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
});
