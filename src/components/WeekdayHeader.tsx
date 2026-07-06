import { StyleSheet, Text, View } from "react-native";

import { CalendarDayUi } from "../constants/calendarDay";
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { AppMessages } from "../constants/messages";

const CELL_WIDTH = "14.2857%";

export function WeekdayHeader() {
  return (
    <View style={styles.weekdays}>
      {AppMessages.weekdayLabels.map((label, index) => (
        <View key={label} style={styles.weekdayCell}>
          <Text style={[styles.weekdayText, getWeekendTextStyle(index)]}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

function getWeekendTextStyle(index: number) {
  if (index === 0) {
    return styles.sundayText;
  }

  if (index === AppMessages.weekdayLabels.length - 1) {
    return styles.saturdayText;
  }

  return null;
}

const styles = StyleSheet.create({
  weekdays: {
    flexDirection: "row",
    borderBottomColor: AppColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingTop: AppLayout.compactGap,
    paddingBottom: 4,
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
  sundayText: {
    color: CalendarDayUi.sundayTextColor,
    opacity: CalendarDayUi.weekendTextOpacity,
  },
  saturdayText: {
    color: CalendarDayUi.saturdayTextColor,
    opacity: CalendarDayUi.weekendTextOpacity,
  },
});
