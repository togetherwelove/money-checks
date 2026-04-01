import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { IconActionButton } from "./IconActionButton";

type CalendarToolbarProps = {
  monthLabel: string;
  onMoveToCurrentMonth: () => void;
};

export function CalendarToolbar({ monthLabel, onMoveToCurrentMonth }: CalendarToolbarProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.monthLabel}>{monthLabel}</Text>
      <View style={styles.todayButton}>
        <IconActionButton icon="clock" onPress={onMoveToCurrentMonth} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignItems: "flex-start",
    justifyContent: "center",
    minHeight: 28,
  },
  monthLabel: {
    color: AppColors.accent,
    fontSize: 13,
    fontWeight: "700",
  },
  todayButton: {
    position: "absolute",
    right: 0,
  },
});
