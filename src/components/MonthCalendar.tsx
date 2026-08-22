import { memo, useCallback, useMemo } from "react";
import { Pressable, type StyleProp, StyleSheet, Text, type TextStyle, View } from "react-native";

import { CalendarDayUi } from "../constants/calendarDay";
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { useExpenseTextColor } from "../contexts/ExpenseTextColorContext";
import type { CalendarDay } from "../types/ledger";
import { formatAmountNumber } from "../utils/amount";
import { parseIsoDate } from "../utils/calendar";
import {
  CALENDAR_AMOUNT_SPACE_HEIGHT,
  CALENDAR_AMOUNT_PADDING_VERTICAL,
  CALENDAR_DAY_CELL_BORDER_WIDTH,
  CALENDAR_DAY_CONTENT_GAP,
  CALENDAR_DAY_NUMBER_BORDER_WIDTH,
  CALENDAR_DAY_NUMBER_HEIGHT,
  CALENDAR_DAY_NUMBER_LINE_HEIGHT,
  CALENDAR_DAY_NUMBER_PADDING_VERTICAL,
  CALENDAR_DAY_NUMBER_WIDTH,
  CALENDAR_WEEK_DIVIDER_WIDTH,
} from "./monthCalendarPager/calendarLayout";
import { CompactTextProps } from "../constants/textLayout";
import { getVisibleCalendarWeeks } from "./monthCalendarPager/calendarWeekCount";

type MonthCalendarProps = {
  days: CalendarDay[];
  isHeatmapEnabled: boolean;
  isReadOnlyDueToPlanLimit?: boolean;
  onSelectDate: (isoDate: string) => void;
  selectedDate: string;
};

type CalendarDayHeatmapTone = "expense" | "income" | null;

const expenseHeatmapStyles = CalendarDayUi.heatmapBackgroundColors.expense.map(
  (backgroundColor) => ({ backgroundColor }),
);

function MonthCalendarComponent({
  days,
  isHeatmapEnabled,
  isReadOnlyDueToPlanLimit = false,
  onSelectDate,
  selectedDate,
}: MonthCalendarProps) {
  const visibleWeeks = useMemo(() => getVisibleCalendarWeeks(days), [days]);
  const heatmapLevels = useMemo(
    () => (isHeatmapEnabled ? buildCurrentMonthHeatmapLevels(days) : new Map<string, number>()),
    [days, isHeatmapEnabled],
  );
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
          <View
            key={week.map((day) => day.isoDate).join(":")}
            style={[styles.weekRow, getWeekDividerStyle(weekIndex)]}
          >
            {week.map((day) => (
              <View key={day.isoDate} style={styles.daySlot}>
                <DayCell
                  day={day}
                  heatmapLevel={heatmapLevels.get(day.isoDate) ?? 0}
                  isReadOnlyDueToPlanLimit={isReadOnlyDueToPlanLimit}
                  isSelected={day.isoDate === selectedDate}
                  onSelectDate={handleSelectDate}
                />
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

function buildCurrentMonthHeatmapLevels(days: CalendarDay[]): Map<string, number> {
  const currentMonthAmounts = days
    .filter((day) => day.isCurrentMonth)
    .map((day) => ({
      amount: getCalendarDayTradeAmount(day),
      isoDate: day.isoDate,
      tone: getCalendarDayHeatmapTone(day),
    }))
    .filter((item) => item.amount > 0 && item.tone !== null);

  if (!currentMonthAmounts.length) {
    return new Map();
  }

  const levelByAmount = buildHeatmapLevelByAmount(
    [...new Set(currentMonthAmounts.map((item) => item.amount))].sort((left, right) => left - right),
  );

  return new Map(currentMonthAmounts.map((item) => [item.isoDate, levelByAmount.get(item.amount) ?? 0]));
}

function getCalendarDayTradeAmount(day: CalendarDay): number {
  return day.expense;
}

const DayCell = memo(function DayCell({
  day,
  heatmapLevel,
  isReadOnlyDueToPlanLimit,
  isSelected,
  onSelectDate,
}: {
  day: CalendarDay;
  heatmapLevel: number;
  isReadOnlyDueToPlanLimit: boolean;
  isSelected: boolean;
  onSelectDate: (isoDate: string) => void;
}) {
  const handlePress = useCallback(() => {
    onSelectDate(day.isoDate);
  }, [day.isoDate, onSelectDate]);

  if (!day.isCurrentMonth) {
    return (
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.dayCell}
      >
        <View style={styles.dayContent}>
          <View style={styles.dayNumberWrap} />
          <View style={styles.amounts} />
        </View>
      </View>
    );
  }

  const dayOfWeek = parseIsoDate(day.isoDate).getDay();
  const isSunday = dayOfWeek === 0;
  const isSaturday = dayOfWeek === 6;
  const shouldApplyWeekendTint = !isSelected && !day.isToday;
  const heatmapTone = getCalendarDayHeatmapTone(day);

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.dayCell,
        getHeatmapStyle(heatmapLevel, heatmapTone),
        isSelected ? styles.selectedDayCell : null,
        day.isToday && isSelected ? styles.selectedTodayDayCell : null,
        isReadOnlyDueToPlanLimit ? styles.readOnlyDayCell : null,
      ]}
    >
      <View style={styles.dayContent}>
        <View style={styles.dayNumberWrap}>
          <Text
            {...CompactTextProps}
            style={[
              styles.dayNumber,
              shouldApplyWeekendTint && isSunday && styles.sundayNumber,
              shouldApplyWeekendTint && isSaturday && styles.saturdayNumber,
              day.isToday && !isSelected ? styles.todayNumber : null,
              isSelected ? styles.selectedDayNumber : null,
              day.isToday && isSelected ? styles.selectedTodayNumber : null,
              isReadOnlyDueToPlanLimit && !isSelected ? styles.readOnlyDayNumber : null,
            ]}
          >
            {day.dayNumber}
          </Text>
        </View>
        <DayAmountLines day={day} isReadOnlyDueToPlanLimit={isReadOnlyDueToPlanLimit} />
      </View>
    </Pressable>
  );
});

function buildHeatmapLevelByAmount(sortedAmounts: number[]): Map<number, number> {
  if (sortedAmounts.length === 1) {
    return new Map([[sortedAmounts[0], CalendarDayUi.heatmapBackgroundColors.expense.length]]);
  }

  return new Map(
    sortedAmounts.map((amount, index) => {
      const ratio = index / (sortedAmounts.length - 1);
      const matchedThresholdIndex = CalendarDayUi.heatmapLevelThresholds.findIndex(
        (threshold) => ratio <= threshold,
      );
      const level =
        matchedThresholdIndex >= 0
          ? matchedThresholdIndex + 1
          : CalendarDayUi.heatmapBackgroundColors.expense.length;

      return [amount, level];
    }),
  );
}

function getCalendarDayHeatmapTone(day: CalendarDay): CalendarDayHeatmapTone {
  if (day.expense <= 0) {
    return null;
  }

  return "expense";
}

function getHeatmapStyle(level: number, tone: CalendarDayHeatmapTone) {
  if (tone === null) {
    return null;
  }

  return getExpenseHeatmapStyle(level);
}

function getExpenseHeatmapStyle(level: number) {
  return expenseHeatmapStyles[level - 1] ?? null;
}

function DayAmountLines({
  day,
  isReadOnlyDueToPlanLimit,
}: {
  day: CalendarDay;
  isReadOnlyDueToPlanLimit: boolean;
}) {
  const expenseTextStyle = useExpenseTextColor().textStyle;

  return (
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
        textStyle={expenseTextStyle}
      />
    </View>
  );
}

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
    return (
      <Text
        {...CompactTextProps}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.amountText, styles.emptyAmountLine]}
      >
        {" "}
      </Text>
    );
  }

  return (
    <Text
      {...CompactTextProps}
      adjustsFontSizeToFit
      minimumFontScale={CalendarDayUi.amountMinimumScale}
      numberOfLines={1}
      style={[
        styles.amountText,
        textStyle,
        isReadOnlyDueToPlanLimit ? styles.readOnlyAmountText : null,
      ]}
    >
      {`${prefix}${formatCalendarDayAmount(amount)}`}
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
    paddingHorizontal: AppLayout.screenPadding,
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
  selectedTodayDayCell: {
    borderColor: AppColors.accent,
  },
  readOnlyDayCell: {
    opacity: CalendarDayUi.readOnlyDayOpacity,
  },
  weekDivider: {
    borderTopColor: AppColors.border,
    borderTopWidth: CALENDAR_WEEK_DIVIDER_WIDTH,
  },
  dayContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: CALENDAR_DAY_CONTENT_GAP,
  },
  dayNumberWrap: {
    position: "relative",
    alignItems: "center",
    minHeight: CALENDAR_DAY_NUMBER_HEIGHT,
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
    fontSize: CalendarDayUi.dayNumberFontSize,
    lineHeight: CALENDAR_DAY_NUMBER_LINE_HEIGHT,
    includeFontPadding: false,
    textAlignVertical: "center",
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
    paddingVertical: CALENDAR_AMOUNT_PADDING_VERTICAL,
  },
  emptyAmountLine: {
    color: AppColors.transparent,
  },
  amountText: {
    maxWidth: "100%",
    fontSize: CalendarDayUi.amountFontSize,
    lineHeight: CalendarDayUi.amountLineHeight,
    includeFontPadding: false,
    textAlignVertical: "center",
    letterSpacing: -0.2,
    fontWeight: "600",
    textAlign: "center",
  },
  incomeText: {
    color: AppColors.income,
  },
  readOnlyAmountText: {
    color: AppColors.mutedText,
  },
});
