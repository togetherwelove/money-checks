import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { AppLayout } from "../../constants/layout";
import { MonthCalendar } from "../MonthCalendar";
import type { MonthPage } from "./monthCalendarPagerUtils";
import {
  CALENDAR_DAYS_PER_WEEK,
  CALENDAR_MONTH_TRANSITION_HEADER_HEIGHT,
  CALENDAR_MONTH_TRANSITION_TITLE_FONT_SIZE,
  CALENDAR_MONTH_TRANSITION_TITLE_LINE_HEIGHT,
} from "./calendarLayout";

const CALENDAR_DAY_COLUMN_INDICES = Array.from(
  { length: CALENDAR_DAYS_PER_WEEK },
  (_, columnIndex) => columnIndex,
);

type MonthCalendarSectionProps = {
  isCalendarHeatmapEnabled: boolean;
  isReadOnlyDueToPlanLimit: boolean;
  onCalendarHeightChange: (pageKey: string, height: number) => void;
  onSelectDate: (isoDate: string) => void;
  page: MonthPage;
  selectedDate: string;
};

function MonthCalendarSectionComponent({
  isCalendarHeatmapEnabled,
  isReadOnlyDueToPlanLimit,
  onCalendarHeightChange,
  onSelectDate,
  page,
  selectedDate,
}: MonthCalendarSectionProps) {
  const monthStartColumn = resolveMonthStartColumn(page);

  return (
    <View
      style={[
        styles.section,
        { height: CALENDAR_MONTH_TRANSITION_HEADER_HEIGHT + page.height },
      ]}
    >
      <View style={styles.monthHeader}>
        <View style={styles.monthHeaderColumns}>
          {CALENDAR_DAY_COLUMN_INDICES.map((columnIndex) => (
            <View key={columnIndex} style={styles.monthHeaderColumn}>
              {columnIndex === monthStartColumn ? (
                <Text accessibilityRole="header" style={styles.monthTitle}>
                  {page.summary.monthLabel}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      </View>
      <View
        collapsable={false}
        onLayout={(event) => {
          onCalendarHeightChange(page.key, event.nativeEvent.layout.height);
        }}
      >
        <MonthCalendar
          days={page.summary.days}
          isHeatmapEnabled={isCalendarHeatmapEnabled}
          isReadOnlyDueToPlanLimit={isReadOnlyDueToPlanLimit}
          onSelectDate={onSelectDate}
          selectedDate={selectedDate}
        />
      </View>
    </View>
  );
}

export const MonthCalendarSection = memo(MonthCalendarSectionComponent);

function resolveMonthStartColumn(page: MonthPage): number {
  const monthStartIndex = page.summary.days.findIndex((day) => day.isCurrentMonth);
  return Math.max(monthStartIndex % CALENDAR_DAYS_PER_WEEK, 0);
}

const styles = StyleSheet.create({
  section: {
    width: "100%",
  },
  monthHeader: {
    height: CALENDAR_MONTH_TRANSITION_HEADER_HEIGHT,
    borderBottomColor: AppColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  monthHeaderColumns: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: AppLayout.screenPadding,
  },
  monthHeaderColumn: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  monthTitle: {
    color: AppColors.text,
    fontSize: CALENDAR_MONTH_TRANSITION_TITLE_FONT_SIZE,
    fontWeight: "800",
    lineHeight: CALENDAR_MONTH_TRANSITION_TITLE_LINE_HEIGHT,
  },
});
