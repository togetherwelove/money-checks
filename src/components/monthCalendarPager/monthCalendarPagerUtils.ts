import { Animated } from "react-native";

import type { MonthlyLedgerSummary } from "../../types/ledger";
import { CALENDAR_ROW_HEIGHT } from "./calendarLayout";
import { getCalendarWeekCount } from "./calendarWeekCount";

export type MonthPage = {
  height: number;
  key: string;
  signature: string;
  summary: MonthlyLedgerSummary;
};

const HEIGHT_ANIMATION_CONFIG = {
  duration: 180,
  useNativeDriver: false,
} as const;

export function buildMonthPageFromSummary(
  monthKey: string,
  summary: MonthlyLedgerSummary,
): MonthPage {
  return {
    height: getCalendarWeekCount(summary.days) * CALENDAR_ROW_HEIGHT,
    key: monthKey,
    signature: buildMonthPageSignature(summary),
    summary,
  };
}

function buildMonthPageSignature(summary: MonthlyLedgerSummary): string {
  return summary.days
    .map((day) => `${day.isoDate}:${day.income}:${day.expense}:${day.isToday ? 1 : 0}`)
    .join("|");
}

export function animateViewportHeight(
  heightValue: Animated.Value,
  nextHeight: number,
  onComplete?: () => void,
) {
  Animated.timing(heightValue, {
    ...HEIGHT_ANIMATION_CONFIG,
    toValue: nextHeight,
  }).start(({ finished }) => {
    if (finished) {
      onComplete?.();
    }
  });
}
