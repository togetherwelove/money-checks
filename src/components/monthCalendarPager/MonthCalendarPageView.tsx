import { memo } from "react";
import { StyleSheet, View } from "react-native";

import type { MonthlyLedgerSummary } from "../../types/ledger";
import { MonthCalendar } from "../MonthCalendar";

type MonthCalendarPageViewProps = {
  days: MonthlyLedgerSummary["days"];
  onSelectDate: (isoDate: string) => void;
  selectedDate: string;
};

function MonthCalendarPageViewComponent({
  days,
  onSelectDate,
  selectedDate,
}: MonthCalendarPageViewProps) {
  return (
    <View style={styles.page}>
      <MonthCalendar days={days} onSelectDate={onSelectDate} selectedDate={selectedDate} />
    </View>
  );
}

export const MonthCalendarPageView = memo(MonthCalendarPageViewComponent);

const styles = StyleSheet.create({
  page: {
    width: "100%",
  },
});
