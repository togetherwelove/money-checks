import { memo, useCallback, useMemo } from "react";
import { Pressable, type StyleProp, StyleSheet, Text, type TextStyle, View } from "react-native";

import { CalendarDayUi } from "../constants/calendarDay";
import {
  type CalendarExpenseColorMode,
  CalendarExpenseColorModes,
} from "../constants/calendarExpenseColor";
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
  expenseColorMode: CalendarExpenseColorMode;
  isHeatmapEnabled: boolean;
  isReadOnlyDueToPlanLimit?: boolean;
  onSelectDate: (isoDate: string) => void;
  selectedDate: string;
};

type CalendarDayHeatmapTone = "expense" | "income" | "mixed";

function MonthCalendarComponent({
  days,
  expenseColorMode,
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
          <View key={week.map((day) => day.isoDate).join(":")} style={styles.weekRow}>
            {week.map((day) => (
              <View key={day.isoDate} style={[styles.daySlot, getWeekDividerStyle(weekIndex)]}>
                {day.isCurrentMonth ? (
                  <DayCell
                    day={day}
                    expenseColorMode={expenseColorMode}
                    heatmapLevel={heatmapLevels.get(day.isoDate) ?? 0}
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

function buildCurrentMonthHeatmapLevels(days: CalendarDay[]): Map<string, number> {
  const currentMonthAmounts = days
    .filter((day) => day.isCurrentMonth)
    .map((day) => ({
      amount: getCalendarDayTradeAmount(day),
      isoDate: day.isoDate,
    }))
    .filter((item) => item.amount > 0);

  if (!currentMonthAmounts.length) {
    return new Map();
  }

  const levelByAmount = buildHeatmapLevelByAmount(
    [...new Set(currentMonthAmounts.map((item) => item.amount))].sort((left, right) => left - right),
  );

  return new Map(currentMonthAmounts.map((item) => [item.isoDate, levelByAmount.get(item.amount) ?? 0]));
}

function getCalendarDayTradeAmount(day: CalendarDay): number {
  return day.income + day.expense;
}

const DayCell = memo(function DayCell({
  day,
  expenseColorMode,
  heatmapLevel,
  isReadOnlyDueToPlanLimit,
  isSelected,
  onSelectDate,
}: {
  day: CalendarDay;
  expenseColorMode: CalendarExpenseColorMode;
  heatmapLevel: number;
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
  const heatmapTone = getCalendarDayHeatmapTone(day);

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.dayCell,
        getHeatmapStyle(heatmapLevel, heatmapTone),
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
        <DayAmountLines
          day={day}
          expenseColorMode={expenseColorMode}
          isReadOnlyDueToPlanLimit={isReadOnlyDueToPlanLimit}
        />
      </View>
    </Pressable>
  );
});

function buildHeatmapLevelByAmount(sortedAmounts: number[]): Map<number, number> {
  if (sortedAmounts.length === 1) {
    return new Map([[sortedAmounts[0], CalendarDayUi.heatmapBackgroundColors.mixed.length]]);
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
          : CalendarDayUi.heatmapBackgroundColors.mixed.length;

      return [amount, level];
    }),
  );
}

function getCalendarDayHeatmapTone(day: CalendarDay): CalendarDayHeatmapTone {
  if (day.income > 0 && day.expense > 0) {
    return "mixed";
  }

  return day.income > 0 ? "income" : "expense";
}

function getHeatmapStyle(level: number, tone: CalendarDayHeatmapTone) {
  if (tone === "income") {
    return getIncomeHeatmapStyle(level);
  }

  if (tone === "expense") {
    return getExpenseHeatmapStyle(level);
  }

  return getMixedHeatmapStyle(level);
}

function getIncomeHeatmapStyle(level: number) {
  if (level === 1) {
    return styles.incomeHeatmapLevel1;
  }

  if (level === 2) {
    return styles.incomeHeatmapLevel2;
  }

  if (level === 3) {
    return styles.incomeHeatmapLevel3;
  }

  if (level === 4) {
    return styles.incomeHeatmapLevel4;
  }

  if (level === 5) {
    return styles.incomeHeatmapLevel5;
  }

  return null;
}

function getExpenseHeatmapStyle(level: number) {
  if (level === 1) {
    return styles.expenseHeatmapLevel1;
  }

  if (level === 2) {
    return styles.expenseHeatmapLevel2;
  }

  if (level === 3) {
    return styles.expenseHeatmapLevel3;
  }

  if (level === 4) {
    return styles.expenseHeatmapLevel4;
  }

  if (level === 5) {
    return styles.expenseHeatmapLevel5;
  }

  return null;
}

function getMixedHeatmapStyle(level: number) {
  if (level === 1) {
    return styles.mixedHeatmapLevel1;
  }

  if (level === 2) {
    return styles.mixedHeatmapLevel2;
  }

  if (level === 3) {
    return styles.mixedHeatmapLevel3;
  }

  if (level === 4) {
    return styles.mixedHeatmapLevel4;
  }

  if (level === 5) {
    return styles.mixedHeatmapLevel5;
  }

  return null;
}

function DayAmountLines({
  day,
  expenseColorMode,
  isReadOnlyDueToPlanLimit,
}: {
  day: CalendarDay;
  expenseColorMode: CalendarExpenseColorMode;
  isReadOnlyDueToPlanLimit: boolean;
}) {
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
        textStyle={
          expenseColorMode === CalendarExpenseColorModes.expense
            ? styles.expenseText
            : styles.defaultExpenseText
        }
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
  },
  daySlot: {
    flex: 1,
  },
  dayCell: {
    position: "relative",
    borderWidth: CALENDAR_DAY_CELL_BORDER_WIDTH,
    borderColor: AppColors.transparent,
  },
  expenseHeatmapLevel1: {
    backgroundColor: CalendarDayUi.heatmapBackgroundColors.expense[0],
  },
  expenseHeatmapLevel2: {
    backgroundColor: CalendarDayUi.heatmapBackgroundColors.expense[1],
  },
  expenseHeatmapLevel3: {
    backgroundColor: CalendarDayUi.heatmapBackgroundColors.expense[2],
  },
  expenseHeatmapLevel4: {
    backgroundColor: CalendarDayUi.heatmapBackgroundColors.expense[3],
  },
  expenseHeatmapLevel5: {
    backgroundColor: CalendarDayUi.heatmapBackgroundColors.expense[4],
  },
  incomeHeatmapLevel1: {
    backgroundColor: CalendarDayUi.heatmapBackgroundColors.income[0],
  },
  incomeHeatmapLevel2: {
    backgroundColor: CalendarDayUi.heatmapBackgroundColors.income[1],
  },
  incomeHeatmapLevel3: {
    backgroundColor: CalendarDayUi.heatmapBackgroundColors.income[2],
  },
  incomeHeatmapLevel4: {
    backgroundColor: CalendarDayUi.heatmapBackgroundColors.income[3],
  },
  incomeHeatmapLevel5: {
    backgroundColor: CalendarDayUi.heatmapBackgroundColors.income[4],
  },
  mixedHeatmapLevel1: {
    backgroundColor: CalendarDayUi.heatmapBackgroundColors.mixed[0],
  },
  mixedHeatmapLevel2: {
    backgroundColor: CalendarDayUi.heatmapBackgroundColors.mixed[1],
  },
  mixedHeatmapLevel3: {
    backgroundColor: CalendarDayUi.heatmapBackgroundColors.mixed[2],
  },
  mixedHeatmapLevel4: {
    backgroundColor: CalendarDayUi.heatmapBackgroundColors.mixed[3],
  },
  mixedHeatmapLevel5: {
    backgroundColor: CalendarDayUi.heatmapBackgroundColors.mixed[4],
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
  defaultExpenseText: {
    color: AppColors.text,
  },
  expenseText: {
    color: AppColors.expense,
  },
  readOnlyAmountText: {
    color: AppColors.mutedText,
  },
});
