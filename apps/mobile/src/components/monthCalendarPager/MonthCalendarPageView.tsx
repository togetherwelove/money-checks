import { Animated, StyleSheet } from "react-native";

import type { MonthlyLedgerSummary } from "../../types/ledger";
import { MonthCalendar } from "../MonthCalendar";

type MonthCalendarPageViewProps = {
  days: MonthlyLedgerSummary["days"];
  isActive: boolean;
  top: number;
  onSelectDate: (isoDate: string) => void;
  selectedDate: string;
  translateY: Animated.Value;
};

export function MonthCalendarPageView({
  days,
  isActive,
  top,
  onSelectDate,
  selectedDate,
  translateY,
}: MonthCalendarPageViewProps) {
  return (
    <Animated.View
      pointerEvents={isActive ? "auto" : "none"}
      style={[styles.page, isActive && styles.activePage, { top, transform: [{ translateY }] }]}
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
    width: "100%",
    zIndex: 1,
  },
  activePage: {
    zIndex: 2,
  },
});
