import { memo } from "react";
import { StyleSheet, View } from "react-native";

import type { MonthlyLedgerSummary } from "../../types/ledger";
import { MonthCalendar } from "../MonthCalendar";

type MonthCalendarPageViewProps = {
  days: MonthlyLedgerSummary["days"];
  isReadOnlyDueToPlanLimit?: boolean;
  onSelectDate: (isoDate: string) => void;
  pageHeight: number;
  selectedDate: string;
};

function MonthCalendarPageViewComponent({
  days,
  isReadOnlyDueToPlanLimit = false,
  onSelectDate,
  pageHeight,
  selectedDate,
}: MonthCalendarPageViewProps) {
  return (
    <View collapsable={false} style={[styles.page, { height: pageHeight }]}>
      <MonthCalendar
        days={days}
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
