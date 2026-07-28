import { memo } from "react";
import { StyleSheet, View } from "react-native";

import type { MonthlyLedgerSummary } from "../../types/ledger";
import { MonthCalendar } from "../MonthCalendar";

type MonthCalendarPageViewProps = {
  days: MonthlyLedgerSummary["days"];
  isCalendarHeatmapEnabled: boolean;
  isReadOnlyDueToPlanLimit?: boolean;
  onContentHeightChange: (pageKey: string, contentHeight: number) => void;
  onSelectDate: (isoDate: string) => void;
  pageHeight: number;
  pageKey: string;
  selectedDate: string;
};

function MonthCalendarPageViewComponent({
  days,
  isCalendarHeatmapEnabled,
  isReadOnlyDueToPlanLimit = false,
  onContentHeightChange,
  onSelectDate,
  pageHeight,
  pageKey,
  selectedDate,
}: MonthCalendarPageViewProps) {
  return (
    <View collapsable={false} style={[styles.page, { height: pageHeight }]}>
      <View
        collapsable={false}
        onLayout={(event) => {
          onContentHeightChange(pageKey, event.nativeEvent.layout.height);
        }}
        style={styles.content}
      >
        <MonthCalendar
          days={days}
          isHeatmapEnabled={isCalendarHeatmapEnabled}
          isReadOnlyDueToPlanLimit={isReadOnlyDueToPlanLimit}
          onSelectDate={onSelectDate}
          selectedDate={selectedDate}
        />
      </View>
    </View>
  );
}

export const MonthCalendarPageView = memo(MonthCalendarPageViewComponent);

const styles = StyleSheet.create({
  content: {
    width: "100%",
  },
  page: {
    flex: 1,
    width: "100%",
  },
});
