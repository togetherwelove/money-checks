import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { MonthCalendar } from "../MonthCalendar";
import type { MonthPage } from "./monthCalendarPagerUtils";

type MonthCalendarSectionProps = {
  isCalendarHeatmapEnabled: boolean;
  isReadOnlyDueToPlanLimit: boolean;
  onCalendarHeightChange: (pageKey: string, height: number) => void;
  onSelectDate: (isoDate: string) => void;
  page: MonthPage;
  selectedDate: string;
};

function MonthCalendarSectionComponent({ isCalendarHeatmapEnabled, isReadOnlyDueToPlanLimit,
  onCalendarHeightChange, onSelectDate, page, selectedDate }: MonthCalendarSectionProps) {
  return <View collapsable={false} style={styles.section}
    onLayout={event => onCalendarHeightChange(page.key, event.nativeEvent.layout.height)}>
    <MonthCalendar days={page.summary.days} isHeatmapEnabled={isCalendarHeatmapEnabled}
      isReadOnlyDueToPlanLimit={isReadOnlyDueToPlanLimit} onSelectDate={onSelectDate} selectedDate={selectedDate} />
  </View>;
}

export const MonthCalendarSection = memo(MonthCalendarSectionComponent);
const styles = StyleSheet.create({ section: { width: "100%" } });
