import { Animated, StyleSheet } from "react-native";

import type { MonthlyLedgerSummary } from "../../types/ledger";
import { MonthCalendar } from "../MonthCalendar";

type MonthCalendarPageViewProps = {
  days: MonthlyLedgerSummary["days"];
  onSelectDate: (isoDate: string) => void;
  selectedDate: string;
  top: number;
  translateY: Animated.Value;
};

export function MonthCalendarPageView({
  days,
  onSelectDate,
  selectedDate,
  top,
  translateY,
}: MonthCalendarPageViewProps) {
  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.page, { top, transform: [{ translateY }] }]}
    >
      <MonthCalendar days={days} onSelectDate={onSelectDate} selectedDate={selectedDate} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  page: {
    position: "absolute",
    left: 0,
    right: 0,
  },
});
