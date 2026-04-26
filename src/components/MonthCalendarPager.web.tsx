import { StyleSheet, View } from "react-native";

import { MonthCalendarPageView } from "./monthCalendarPager/MonthCalendarPageView";
import type { MonthCalendarPagerProps } from "./monthCalendarPager/monthCalendarPagerTypes";

export function MonthCalendarPager({
  currentPage,
  onSelectDate,
  selectedDate,
}: MonthCalendarPagerProps) {
  return (
    <View style={[styles.viewport, { height: currentPage.height }]}>
      <MonthCalendarPageView
        days={currentPage.summary.days}
        onSelectDate={onSelectDate}
        selectedDate={selectedDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    overflow: "hidden",
    width: "100%",
  },
});
