import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { AppMessages } from "../constants/messages";

const CELL_WIDTH = "14.2857%";

export function WeekdayHeader() {
  return (
    <View style={styles.weekdays}>
      {AppMessages.weekdayLabels.map((label) => (
        <View key={label} style={styles.weekdayCell}>
          <Text style={styles.weekdayText}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  weekdays: {
    flexDirection: "row",
  },
  weekdayCell: {
    width: CELL_WIDTH,
    alignItems: "center",
  },
  weekdayText: {
    color: AppColors.mutedText,
    fontSize: 11,
    fontWeight: "700",
  },
});
