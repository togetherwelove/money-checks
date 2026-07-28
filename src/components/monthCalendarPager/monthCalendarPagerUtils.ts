import { Animated } from "react-native";

import type { MonthlyLedgerSummary } from "../../types/ledger";
import {
  CALENDAR_BOTTOM_BORDER_CLIP_PADDING,
  resolveCalendarWeekHeight,
  resolveCalendarWeekDividerHeight,
} from "./calendarLayout";
import { getVisibleCalendarWeeks } from "./calendarWeekCount";

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
  fontScale = 1,
): MonthPage {
  return {
    height: resolveCalendarHeight(summary.days, fontScale),
    key: monthKey,
    signature: buildMonthPageSignature(summary),
    summary,
  };
}

export function resolveCalendarHeight(
  days: MonthlyLedgerSummary["days"],
  fontScale = 1,
): number {
  const visibleWeeks = getVisibleCalendarWeeks(days);

  return Math.ceil(
    visibleWeeks.reduce(
      (totalHeight, week) => totalHeight + resolveCalendarWeekHeight(week, fontScale),
      0,
    ) +
      resolveCalendarWeekDividerHeight(visibleWeeks.length) +
      CALENDAR_BOTTOM_BORDER_CLIP_PADDING,
  );
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
