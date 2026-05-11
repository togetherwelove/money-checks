import { memo, useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CalendarDayUi } from "../constants/calendarDay";
import { AppColors } from "../constants/colors";
import { DateMemoUi } from "../constants/dateMemo";
import type { CalendarDay } from "../types/ledger";
import { formatAmountNumber } from "../utils/amount";
import { parseIsoDate } from "../utils/calendar";
import {
  CALENDAR_DAYS_PER_WEEK,
  CALENDAR_DAY_CELL_PADDING_VERTICAL,
  CALENDAR_DAY_CONTENT_GAP,
  CALENDAR_DAY_NUMBER_LINE_HEIGHT,
  CALENDAR_EMPTY_AMOUNT_SPACE_HEIGHT,
  CALENDAR_ROW_PADDING,
} from "./monthCalendarPager/calendarLayout";
import { getVisibleCalendarDays } from "./monthCalendarPager/calendarWeekCount";

type MonthCalendarProps = {
  days: CalendarDay[];
  onSelectDate: (isoDate: string) => void;
  selectedDate: string;
};

const CELL_WIDTH = "14.2857%";
const CALENDAR_DAY_HORIZONTAL_PADDING = 0;
const CALENDAR_DAY_VERTICAL_PADDING = CALENDAR_ROW_PADDING;

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
        {visibleDays.map((day, index) => (
          <View key={day.isoDate} style={[styles.daySlot, getWeekDividerStyle(index)]}>
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
  const hasDateMemo = day.note.trim().length > 0;
  const dayOfWeek = parseIsoDate(day.isoDate).getDay();
  const isSunday = dayOfWeek === 0;
  const isSaturday = dayOfWeek === 6;
  const shouldApplyWeekendTint = !isSelected && !day.isToday;
  const handlePress = useCallback(() => {
    onSelectDate(day.isoDate);
  }, [day.isoDate, onSelectDate]);

  return (
    <Pressable onPress={handlePress} style={styles.dayCell}>
      <View style={styles.dayContent}>
        <View style={styles.dayNumberWrap}>
          <Text
            style={[
              styles.dayNumber,
              shouldApplyWeekendTint && isSunday && styles.sundayNumber,
              shouldApplyWeekendTint && isSaturday && styles.saturdayNumber,
              day.isToday && styles.todayNumber,
              isSelected && styles.selectedNumber,
            ]}
          >
            {day.dayNumber}
          </Text>
          {hasDateMemo ? <View style={styles.memoIndicator} /> : null}
        </View>
        {hasEntry ? (
          <View style={styles.amounts}>
            {day.income > 0 ? (
              <Text
                adjustsFontSizeToFit
                minimumFontScale={CalendarDayUi.amountMinimumScale}
                numberOfLines={1}
                style={[styles.amountText, styles.incomeText]}
              >
                +{formatCalendarDayAmount(day.income)}
              </Text>
            ) : null}
            {day.expense > 0 ? (
              <Text
                adjustsFontSizeToFit
                minimumFontScale={CalendarDayUi.amountMinimumScale}
                numberOfLines={1}
                style={[styles.amountText, styles.expenseText]}
              >
                -{formatCalendarDayAmount(day.expense)}
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.emptyAmountSpace} />
        )}
      </View>
    </Pressable>
  );
});

function getWeekDividerStyle(dayIndex: number) {
  return dayIndex >= CALENDAR_DAYS_PER_WEEK ? styles.weekDivider : null;
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
    paddingVertical: CALENDAR_DAY_VERTICAL_PADDING,
  },
  dayCell: {
    position: "relative",
    paddingVertical: CALENDAR_DAY_CELL_PADDING_VERTICAL,
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
  memoIndicator: {
    position: "absolute",
    top: DateMemoUi.calendarIndicatorOffsetTop,
    right: DateMemoUi.calendarIndicatorOffsetRight,
    width: DateMemoUi.calendarIndicatorSize,
    height: DateMemoUi.calendarIndicatorSize,
    borderRadius: DateMemoUi.calendarIndicatorSize,
    backgroundColor: AppColors.primary,
  },
  dayNumberWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumber: {
    color: AppColors.text,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 999,
    fontSize: 11,
    lineHeight: CALENDAR_DAY_NUMBER_LINE_HEIGHT,
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
  amounts: {
    width: "100%",
    alignItems: "center",
    gap: 0,
  },
  emptyAmountSpace: {
    height: CALENDAR_EMPTY_AMOUNT_SPACE_HEIGHT,
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
});
