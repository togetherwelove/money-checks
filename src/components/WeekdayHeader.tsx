import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import { StyleSheet, Text, View } from "react-native";

import { getCalendarDayUi } from "../constants/calendarDay";
import { getAppColors } from "../constants/colors";
import { AppMessages } from "../constants/messages";
import { CompactTextProps } from "../constants/textLayout";
import { FullBleedPaddedHorizontalStyle } from "../constants/uiStyles";

const CELL_WIDTH = "14.2857%";

export function WeekdayHeader() {
  const styles = getStyles();
  useAppTheme();
  return (
    <View style={styles.weekdays}>
      {AppMessages.weekdayLabels.map((label, index) => (
        <View key={label} style={styles.weekdayCell}>
          <Text {...CompactTextProps} style={[styles.weekdayText, getWeekendTextStyle(index)]}>
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function getWeekendTextStyle(index: number) {
  if (index === 0) {
    return getStyles().sundayText;
  }

  if (index === AppMessages.weekdayLabels.length - 1) {
    return getStyles().saturdayText;
  }

  return null;
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    weekdays: {
      ...FullBleedPaddedHorizontalStyle,
      flexDirection: "row",
      borderBottomColor: getAppColors().border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      paddingVertical: getCalendarDayUi().weekdayPaddingVertical,
    },
    weekdayCell: {
      width: CELL_WIDTH,
      alignItems: "center",
    },
    weekdayText: {
      color: getAppColors().mutedText,
      fontSize: getCalendarDayUi().weekdayFontSize,
      fontWeight: "700",
    },
    sundayText: {
      color: getCalendarDayUi().sundayTextColor,
      opacity: getCalendarDayUi().weekendTextOpacity,
    },
    saturdayText: {
      color: getCalendarDayUi().saturdayTextColor,
      opacity: getCalendarDayUi().weekendTextOpacity,
    },
  }),
);
