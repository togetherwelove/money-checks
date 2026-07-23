import { memo } from "react";
import { StyleSheet, View } from "react-native";

import type { CalendarExpenseColorMode } from "../../constants/calendarExpenseColor";
import type { MonthlyLedgerSummary } from "../../types/ledger";
import { MonthCalendar } from "../MonthCalendar";

type MonthCalendarPageViewProps = {
  calendarExpenseColorMode: CalendarExpenseColorMode;
  days: MonthlyLedgerSummary["days"];
  isCalendarHeatmapEnabled: boolean;
  isReadOnlyDueToPlanLimit?: boolean;
  onSelectDate: (isoDate: string) => void;
  pageHeight: number;
  selectedDate: string;
};

function MonthCalendarPageViewComponent({
  calendarExpenseColorMode,
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
        expenseColorMode={calendarExpenseColorMode}
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
