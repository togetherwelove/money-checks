import { memo, useCallback, useMemo } from "react";
import { Pressable, type StyleProp, StyleSheet, Text, type TextStyle, View } from "react-native";

import { CalendarDayUi } from "../constants/calendarDay";
import { AppColors } from "../constants/colors";
import type { CalendarDay } from "../types/ledger";
import { formatAmountNumber } from "../utils/amount";
import { parseIsoDate } from "../utils/calendar";
import {
  CALENDAR_AMOUNT_SPACE_HEIGHT,
  CALENDAR_DAY_CELL_BORDER_WIDTH,
  CALENDAR_DAY_CONTENT_GAP,
  CALENDAR_DAY_NUMBER_BORDER_WIDTH,
  CALENDAR_DAY_NUMBER_HEIGHT,
  CALENDAR_DAY_NUMBER_LINE_HEIGHT,
  CALENDAR_DAY_NUMBER_PADDING_VERTICAL,
  CALENDAR_DAY_NUMBER_WIDTH,
} from "./monthCalendarPager/calendarLayout";
import { getVisibleCalendarWeeks } from "./monthCalendarPager/calendarWeekCount";

type MonthCalendarProps = {
  days: CalendarDay[];
  isReadOnlyDueToPlanLimit?: boolean;
  onSelectDate: (isoDate: string) => void;
  selectedDate: string;
};

function MonthCalendarComponent({
  days,
  isReadOnlyDueToPlanLimit = false,
  onSelectDate,
  selectedDate,
}: MonthCalendarProps) {
  const visibleWeeks = useMemo(() => getVisibleCalendarWeeks(days), [days]);
  const handleSelectDate = useCallback(
    (isoDate: string) => {
      onSelectDate(isoDate);
    },
    [onSelectDate],
  );

  return (
    <View style={[styles.container, isReadOnlyDueToPlanLimit ? styles.readOnlyContainer : null]}>
      <View style={styles.grid}>
        {visibleWeeks.map((week, weekIndex) => (
          <View key={week.map((day) => day.isoDate).join(":")} style={styles.weekRow}>
            {week.map((day) => (
              <View key={day.isoDate} style={[styles.daySlot, getWeekDividerStyle(weekIndex)]}>
                {day.isCurrentMonth ? (
                  <DayCell
                    day={day}
                    isReadOnlyDueToPlanLimit={isReadOnlyDueToPlanLimit}
                    isSelected={day.isoDate === selectedDate}
                    onSelectDate={handleSelectDate}
                  />
                ) : (
                  <View style={[styles.dayCell, styles.emptyDayCell]} />
                )}
              </View>
            ))}
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
  isReadOnlyDueToPlanLimit,
  isSelected,
  onSelectDate,
}: {
  day: CalendarDay;
  isReadOnlyDueToPlanLimit: boolean;
  isSelected: boolean;
  onSelectDate: (isoDate: string) => void;
}) {
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
      style={[
        styles.dayCell,
        day.isToday && !isSelected ? styles.todayDayCell : null,
        isSelected ? styles.selectedDayCell : null,
        day.isToday && isSelected ? styles.selectedTodayDayCell : null,
        isReadOnlyDueToPlanLimit ? styles.readOnlyDayCell : null,
        isReadOnlyDueToPlanLimit && day.isToday && !isSelected ? styles.readOnlyTodayDayCell : null,
        isReadOnlyDueToPlanLimit && isSelected ? styles.readOnlySelectedDayCell : null,
      ]}
    >
      <View style={styles.dayContent}>
        <View style={styles.dayNumberWrap}>
          <Text
            style={[
              styles.dayNumber,
              shouldApplyWeekendTint && isSunday && styles.sundayNumber,
              shouldApplyWeekendTint && isSaturday && styles.saturdayNumber,
              day.isToday && !isSelected ? styles.todayNumber : null,
              isSelected ? styles.selectedDayNumber : null,
              day.isToday && isSelected ? styles.selectedTodayNumber : null,
              isReadOnlyDueToPlanLimit ? styles.readOnlyDayNumber : null,
              isReadOnlyDueToPlanLimit && day.isToday && !isSelected
                ? styles.readOnlyTodayNumber
                : null,
            ]}
          >
            {day.dayNumber}
          </Text>
        </View>
        <View style={styles.amounts}>
          <AmountLine
            amount={day.income}
            isReadOnlyDueToPlanLimit={isReadOnlyDueToPlanLimit}
            prefix="+"
            textStyle={styles.incomeText}
          />
          <AmountLine
            amount={day.expense}
            isReadOnlyDueToPlanLimit={isReadOnlyDueToPlanLimit}
            prefix="-"
            textStyle={styles.expenseText}
          />
        </View>
      </View>
    </Pressable>
  );
});

function AmountLine({
  amount,
  isReadOnlyDueToPlanLimit,
  prefix,
  textStyle,
}: {
  amount: number;
  isReadOnlyDueToPlanLimit: boolean;
  prefix: string;
  textStyle: StyleProp<TextStyle>;
}) {
  if (amount <= 0) {
    return <View style={styles.emptyAmountLine} />;
  }

  return (
    <Text
      adjustsFontSizeToFit
      minimumFontScale={CalendarDayUi.amountMinimumScale}
      numberOfLines={1}
      style={[
        styles.amountText,
        textStyle,
        isReadOnlyDueToPlanLimit ? styles.readOnlyAmountText : null,
      ]}
    >
      {prefix}
      {formatCalendarDayAmount(amount)}
    </Text>
  );
}

function getWeekDividerStyle(weekIndex: number) {
  return weekIndex > 0 ? styles.weekDivider : null;
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  readOnlyContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surfaceMuted,
  },
  grid: {
    width: "100%",
  },
  weekRow: {
    flexDirection: "row",
  },
  daySlot: {
    flex: 1,
  },
  dayCell: {
    position: "relative",
    borderWidth: CALENDAR_DAY_CELL_BORDER_WIDTH,
    borderColor: AppColors.transparent,
  },
  selectedDayCell: {
    borderColor: AppColors.primary,
  },
  todayDayCell: {
  },
  selectedTodayDayCell: {
    borderColor: AppColors.accent,
  },
  readOnlyDayCell: {
    opacity: CalendarDayUi.readOnlyDayOpacity,
  },
  readOnlyTodayDayCell: {
    borderColor: AppColors.border,
  },
  readOnlySelectedDayCell: {
    borderColor: AppColors.border,
    backgroundColor: AppColors.surfaceStrong,
  },
  emptyDayCell: {},
  weekDivider: {
    borderTopColor: AppColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  dayContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: CALENDAR_DAY_CONTENT_GAP,
  },
  dayNumberWrap: {
    position: "relative",
    alignItems: "center",
    height: CALENDAR_DAY_NUMBER_HEIGHT,
    justifyContent: "center",
    width: CALENDAR_DAY_NUMBER_WIDTH,
  },
  dayNumber: {
    color: AppColors.text,
    borderWidth: CALENDAR_DAY_NUMBER_BORDER_WIDTH,
    borderColor: AppColors.transparent,
    paddingHorizontal: 0,
    paddingVertical: CALENDAR_DAY_NUMBER_PADDING_VERTICAL,
    borderRadius: 999,
    fontSize: 11,
    lineHeight: CALENDAR_DAY_NUMBER_LINE_HEIGHT,
    fontWeight: "800",
    textAlign: "center",
  },
  todayNumber: {
    color: AppColors.accent,
  },
  selectedDayNumber: {
    color: AppColors.primary,
  },
  selectedTodayNumber: {
    color: AppColors.accent,
  },
  readOnlyDayNumber: {
    color: AppColors.mutedText,
  },
  readOnlyTodayNumber: {
    color: AppColors.mutedText,
  },
  sundayNumber: {
    color: CalendarDayUi.sundayTextColor,
    opacity: CalendarDayUi.weekendTextOpacity,
  },
  saturdayNumber: {
    color: CalendarDayUi.saturdayTextColor,
    opacity: CalendarDayUi.weekendTextOpacity,
  },
  amounts: {
    width: "100%",
    alignItems: "center",
    gap: 0,
    minHeight: CALENDAR_AMOUNT_SPACE_HEIGHT,
  },
  emptyAmountLine: {
    height: CalendarDayUi.amountLineHeight,
  },
  amountText: {
    maxWidth: "100%",
    fontSize: CalendarDayUi.amountFontSize,
    lineHeight: CalendarDayUi.amountLineHeight,
    letterSpacing: -0.2,
    fontWeight: "600",
    textAlign: "center",
  },
  incomeText: {
    color: AppColors.income,
  },
  expenseText: {
    color: AppColors.expense,
  },
  readOnlyAmountText: {
    color: AppColors.mutedText,
  },
});
