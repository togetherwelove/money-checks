import { memo } from "react";
import { StyleSheet, View } from "react-native";

import type { MonthlyLedgerSummary } from "../../types/ledger";
import { MonthCalendar } from "../MonthCalendar";

type MonthCalendarPageViewProps = {
  days: MonthlyLedgerSummary["days"];
  isCalendarHeatmapEnabled: boolean;
  isReadOnlyDueToPlanLimit?: boolean;
  onSelectDate: (isoDate: string) => void;
  pageHeight: number;
  selectedDate: string;
};

function MonthCalendarPageViewComponent({
  days,
  isCalendarHeatmapEnabled,
  isReadOnlyDueToPlanLimit = false,
  onSelectDate,
  pageHeight,
  selectedDate,
}: MonthCalendarPageViewProps) {
  return (
    <View collapsable={false} style={[styles.page, { height: pageHeight }]}>
      <MonthCalendar
        days={days}
        isHeatmapEnabled={isCalendarHeatmapEnabled}
        isReadOnlyDueToPlanLimit={isReadOnlyDueToPlanLimit}
        onSelectDate={onSelectDate}
        selectedDate={selectedDate}
      />
    </View>
  );
}

export const MonthCalendarPageView = memo(MonthCalendarPageViewComponent);

const styles = StyleSheet.create({
  page: {
    flex: 1,
    width: "100%",
  },
});
