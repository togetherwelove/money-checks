import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import type { CalendarDay } from "../types/ledger";
import { formatCurrency } from "../utils/calendar";
import {
  CALENDAR_DAY_CELL_MIN_HEIGHT,
  CALENDAR_ROW_HEIGHT,
  CALENDAR_ROW_PADDING,
} from "./monthCalendarPager/calendarLayout";
import { getVisibleCalendarDays } from "./monthCalendarPager/calendarWeekCount";

type MonthCalendarProps = {
  days: CalendarDay[];
  onSelectDate: (isoDate: string) => void;
  selectedDate: string;
};

const CELL_WIDTH = "14.2857%";

export function MonthCalendar({ days, onSelectDate, selectedDate }: MonthCalendarProps) {
  const visibleDays = useMemo(() => getVisibleCalendarDays(days), [days]);

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {visibleDays.map((day) => (
          <View key={day.isoDate} style={styles.daySlot}>
            {day.isCurrentMonth ? (
              <DayCell
                day={day}
                isSelected={day.isoDate === selectedDate}
                onPress={() => onSelectDate(day.isoDate)}
              />
            ) : (
              <View style={[styles.dayCell, styles.emptyDayCell]} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

function DayCell({
  day,
  isSelected,
  onPress,
}: {
  day: CalendarDay;
  isSelected: boolean;
  onPress: () => void;
}) {
  const hasEntry = day.income > 0 || day.expense > 0;
  const isAdjacentMonth = !day.isCurrentMonth;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.dayCell, isAdjacentMonth && styles.adjacentMonthCell]}
    >
      <View style={styles.dayContent}>
        <Text
          style={[
            styles.dayNumber,
            day.isToday && styles.todayNumber,
            isSelected && styles.selectedNumber,
            isAdjacentMonth && styles.adjacentMonthText,
          ]}
        >
          {day.dayNumber}
        </Text>
        {hasEntry ? (
          <View style={styles.amounts}>
            {day.income > 0 ? (
              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.45}
                numberOfLines={1}
                style={[
                  styles.amountText,
                  styles.incomeText,
                  isAdjacentMonth && styles.mutedAmount,
                ]}
              >
                +{formatCurrency(day.income)}
              </Text>
            ) : null}
            {day.expense > 0 ? (
              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.45}
                numberOfLines={1}
                style={[
                  styles.amountText,
                  styles.expenseText,
                  isAdjacentMonth && styles.mutedAmount,
                ]}
              >
                -{formatCurrency(day.expense)}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  daySlot: {
    width: CELL_WIDTH,
    paddingHorizontal: 1,
    paddingVertical: CALENDAR_ROW_PADDING,
  },
  dayCell: {
    position: "relative",
    minHeight: CALENDAR_DAY_CELL_MIN_HEIGHT,
    paddingHorizontal: 2,
    paddingVertical: 2,
    backgroundColor: AppColors.surface,
    borderRadius: 10,
  },
  adjacentMonthCell: {
    backgroundColor: AppColors.background,
  },
  emptyDayCell: {
    backgroundColor: AppColors.background,
  },
  dayContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  dayNumber: {
    color: AppColors.text,
    minWidth: 22,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  todayNumber: {
    backgroundColor: AppColors.accentSoft,
    color: AppColors.accent,
  },
  selectedNumber: {
    backgroundColor: AppColors.primary,
    color: AppColors.inverseText,
  },
  adjacentMonthText: {
    color: AppColors.mutedStrongText,
  },
  amounts: {
    width: "100%",
    alignItems: "center",
    gap: 0,
  },
  amountText: {
    maxWidth: "100%",
    fontSize: 8,
    lineHeight: 10,
    letterSpacing: -0.2,
    fontWeight: "600",
    textAlign: "center",
  },
  mutedAmount: {
    opacity: 0.7,
  },
  incomeText: {
    color: AppColors.income,
  },
  expenseText: {
    color: AppColors.expense,
  },
});
