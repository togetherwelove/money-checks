import { memo } from "react";
import { Animated, StyleSheet } from "react-native";
import { MonthCalendar } from "../MonthCalendar";
import type { MonthPage } from "./monthCalendarPagerUtils";
import type { CalendarWeekFrame } from "./monthCalendarPagerTypes";

type MonthCalendarSectionProps = {
  isCalendarHeatmapEnabled: boolean;
  isReadOnlyDueToPlanLimit: boolean;
  onCalendarHeightChange: (pageKey: string, height: number) => void;
  onSelectDate: (isoDate: string) => void;
  page: MonthPage;
  selectedDate: string;
  collapsedWeekIndex?: number;
  translateY?: Animated.AnimatedInterpolation<number>;
  onWeekLayout?: (pageKey: string, index: number, frame: CalendarWeekFrame) => void;
};

function MonthCalendarSectionComponent({
  isCalendarHeatmapEnabled,
  isReadOnlyDueToPlanLimit,
  onCalendarHeightChange,
  onSelectDate,
  page,
  selectedDate,
  collapsedWeekIndex,
  translateY,
  onWeekLayout,
}: MonthCalendarSectionProps) {
  return (
    <Animated.View
      collapsable={false}
      style={[styles.section, translateY && { transform: [{ translateY }] }]}
      onLayout={(event) => onCalendarHeightChange(page.key, event.nativeEvent.layout.height)}
    >
      <MonthCalendar
        days={page.summary.days}
        isHeatmapEnabled={isCalendarHeatmapEnabled}
        isReadOnlyDueToPlanLimit={isReadOnlyDueToPlanLimit}
        onSelectDate={onSelectDate}
        selectedDate={selectedDate}
        collapsedWeekIndex={collapsedWeekIndex}
        onWeekLayout={
          onWeekLayout &&
          ((index, layout) =>
            onWeekLayout(page.key, index, { top: layout.y, height: layout.height }))
        }
      />
    </Animated.View>
  );
}

export const MonthCalendarSection = memo(MonthCalendarSectionComponent);
const styles = StyleSheet.create({ section: { width: "100%" } });
