import { memo, useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CalendarDayUi } from "../constants/calendarDay";
import { AppColors } from "../constants/colors";
import type { CalendarDay } from "../types/ledger";
import { formatAmountNumber } from "../utils/amount";
import { parseIsoDate } from "../utils/calendar";
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

function MonthCalendarComponent({ days, onSelectDate, selectedDate }: MonthCalendarProps) {
  const visibleDays = useMemo(() => getVisibleCalendarDays(days), [days]);
  const handleSelectDate = useCallback(
    (isoDate: string) => {
      onSelectDate(isoDate);
    },
    [onSelectDate],
  );

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {visibleDays.map((day) => (
          <View key={day.isoDate} style={styles.daySlot}>
            {day.isCurrentMonth ? (
              <DayCell
                day={day}
                isSelected={day.isoDate === selectedDate}
                onSelectDate={handleSelectDate}
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

export const MonthCalendar = memo(MonthCalendarComponent);

function formatCalendarDayAmount(amount: number): string {
  return formatAmountNumber(amount);
}

const DayCell = memo(function DayCell({
  day,
  isSelected,
  onSelectDate,
}: {
  day: CalendarDay;
  isSelected: boolean;
  onSelectDate: (isoDate: string) => void;
}) {
  const hasEntry = day.income > 0 || day.expense > 0;
  const isAdjacentMonth = !day.isCurrentMonth;
  const dayOfWeek = parseIsoDate(day.isoDate).getDay();
  const isSunday = dayOfWeek === 0;
  const isSaturday = dayOfWeek === 6;
  const shouldApplyWeekendTint = !isSelected && !day.isToday;
  const handlePress = useCallback(() => {
    onSelectDate(day.isoDate);
  }, [day.isoDate, onSelectDate]);

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.dayCell, isAdjacentMonth && styles.adjacentMonthCell]}
    >
      <View style={styles.dayContent}>
        <Text
          style={[
            styles.dayNumber,
            shouldApplyWeekendTint && isSunday && styles.sundayNumber,
            shouldApplyWeekendTint && isSaturday && styles.saturdayNumber,
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
                minimumFontScale={CalendarDayUi.amountMinimumScale}
                numberOfLines={1}
                style={[
                  styles.amountText,
                  styles.incomeText,
                  isAdjacentMonth && styles.mutedAmount,
                ]}
              >
                +{formatCalendarDayAmount(day.income)}
              </Text>
            ) : null}
            {day.expense > 0 ? (
              <Text
                adjustsFontSizeToFit
                minimumFontScale={CalendarDayUi.amountMinimumScale}
                numberOfLines={1}
                style={[
                  styles.amountText,
                  styles.expenseText,
                  isAdjacentMonth && styles.mutedAmount,
                ]}
              >
                -{formatCalendarDayAmount(day.expense)}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});

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
    paddingHorizontal: 2,
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
  sundayNumber: {
    color: CalendarDayUi.sundayTextColor,
    opacity: CalendarDayUi.weekendTextOpacity,
  },
  saturdayNumber: {
    color: CalendarDayUi.saturdayTextColor,
    opacity: CalendarDayUi.weekendTextOpacity,
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
    fontSize: CalendarDayUi.amountFontSize,
    lineHeight: CalendarDayUi.amountLineHeight,
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
