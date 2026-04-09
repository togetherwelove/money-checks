import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { ICON_ACTION_BUTTON_SIZE, IconActionButton } from "./IconActionButton";

type CalendarToolbarProps = {
  monthLabel: string;
  onSelectToday: () => void;
};

export function CalendarToolbar({ monthLabel, onSelectToday }: CalendarToolbarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.leadingSpace} />
      <View style={styles.monthLabelContainer}>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
      </View>
      <IconActionButton
        accessibilityLabel="오늘 날짜로 이동"
        icon="crosshair"
        onPress={onSelectToday}
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
  monthLabelContainer: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
  },
  monthLabel: {
    color: AppColors.accent,
    fontSize: 18,
    fontWeight: "700",
  },
  leadingSpace: {
    width: ICON_ACTION_BUTTON_SIZE,
  },
});
