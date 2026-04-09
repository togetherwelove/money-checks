import type { MutableRefObject } from "react";
import { Animated } from "react-native";

import type { LedgerEntry, MonthlyLedgerSummary } from "../../types/ledger";
import { addMonths, buildMonthlyLedger, getMonthKey } from "../../utils/calendar";
import { CALENDAR_ROW_HEIGHT } from "./calendarLayout";
import { getCalendarWeekCount } from "./calendarWeekCount";

export type MonthPage = {
  height: number;
  key: string;
  summary: MonthlyLedgerSummary;
};

const MAX_DRAG_RATIO = 0.92;
const SPRING_CONFIG = {
  friction: 10,
  tension: 70,
  useNativeDriver: true,
} as const;

export function buildMonthPage(
  entries: LedgerEntry[],
  visibleMonth: Date,
  monthOffset: -1 | 0 | 1,
): MonthPage {
  const month = addMonths(visibleMonth, monthOffset);
  const summary = buildMonthlyLedger(getMonthKey(month), entries);
  return {
    height: getCalendarWeekCount(summary.days) * CALENDAR_ROW_HEIGHT,
    key: getMonthKey(month),
    summary,
  };
}

export function resolveViewportHeight(currentHeight: number, targetHeight: number): number {
  return Math.max(currentHeight, targetHeight);
}

export function clampDrag(translationY: number, viewportHeight: number): number {
  const maxDistance = viewportHeight * MAX_DRAG_RATIO;
  return Math.max(-maxDistance, Math.min(maxDistance, translationY));
}

export function resolveTargetTop(
  monthOffset: -1 | 1,
  currentHeight: number,
  targetHeight: number,
): number {
  return monthOffset > 0 ? currentHeight : -targetHeight;
}

export function animateTo(
  translateValue: Animated.Value,
  isAnimatingRef: MutableRefObject<boolean>,
  targetValue: number,
  onComplete?: () => void,
) {
  isAnimatingRef.current = true;
  Animated.spring(translateValue, {
    ...SPRING_CONFIG,
    toValue: targetValue,
  }).start(({ finished }) => {
    isAnimatingRef.current = false;
    if (!finished) {
      translateValue.setValue(0);
      return;
    }
    onComplete?.();
  });
}
