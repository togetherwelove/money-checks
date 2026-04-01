import type { MutableRefObject } from "react";
import { Animated } from "react-native";

import type { LedgerEntry, MonthlyLedgerSummary } from "../../types/ledger";
import { addMonths, buildMonthlyLedger, getMonthKey } from "../../utils/calendar";
import { CALENDAR_ROW_HEIGHT, getCalendarWeekCount } from "../MonthCalendar";

type MonthPage = {
  height: number;
  key: string;
  summary: MonthlyLedgerSummary;
};

const MAX_DRAG_RATIO = 0.92;
const TRANSITION_THRESHOLD_RATIO = 0.18;
const SPRING_CONFIG = {
  friction: 10,
  tension: 70,
  useNativeDriver: true,
} as const;

export function buildMonthPages(entries: LedgerEntry[], visibleMonth: Date): MonthPage[] {
  return [-1, 0, 1].map((monthOffset) => {
    const month = addMonths(visibleMonth, monthOffset);
    const summary = buildMonthlyLedger(getMonthKey(month), entries);
    return {
      height: getCalendarWeekCount(summary.days) * CALENDAR_ROW_HEIGHT,
      key: getMonthKey(month),
      summary,
    };
  });
}

export function resolveMonthOffset(translationY: number, calendarHeight: number): number {
  const threshold = Math.min(calendarHeight * TRANSITION_THRESHOLD_RATIO, 64);
  if (Math.abs(translationY) < threshold) {
    return 0;
  }
  return translationY < 0 ? 1 : -1;
}

export function resolveViewportHeight(
  translationY: number,
  previousHeight: number,
  currentHeight: number,
  nextHeight: number,
): number {
  if (translationY < 0) {
    return Math.max(currentHeight, nextHeight);
  }
  if (translationY > 0) {
    return Math.max(currentHeight, previousHeight);
  }
  return currentHeight;
}

export function clampDrag(
  translationY: number,
  previousHeight: number,
  currentHeight: number,
  nextHeight: number,
): number {
  const maxDistance = Math.max(previousHeight, currentHeight, nextHeight) * MAX_DRAG_RATIO;
  return Math.max(-maxDistance, Math.min(maxDistance, translationY));
}

export function animateTo(
  translateY: Animated.Value,
  isAnimatingRef: MutableRefObject<boolean>,
  targetValue: number,
  onComplete?: () => void,
) {
  isAnimatingRef.current = true;
  Animated.spring(translateY, {
    ...SPRING_CONFIG,
    toValue: targetValue,
  }).start(({ finished }) => {
    isAnimatingRef.current = false;
    if (!finished) {
      translateY.setValue(0);
      return;
    }
    onComplete?.();
  });
}
