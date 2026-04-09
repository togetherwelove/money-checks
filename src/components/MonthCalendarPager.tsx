import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, PanResponder, StyleSheet, View } from "react-native";

import type { LedgerEntry } from "../types/ledger";
import { MonthCalendarPageView } from "./monthCalendarPager/MonthCalendarPageView";
import { resolveMonthOffset } from "./monthCalendarPager/monthCalendarGesture";
import {
  animateTo,
  buildMonthPage,
  clampDrag,
  resolveTargetTop,
} from "./monthCalendarPager/monthCalendarPagerUtils";

type MonthCalendarPagerProps = {
  entries: LedgerEntry[];
  onMoveMonth: (monthOffset: number) => void;
  onSelectDate: (isoDate: string) => void;
  selectedDate: string;
  visibleMonth: Date;
};

const SWIPE_START_DISTANCE = 12;
const SWIPE_CAPTURE_RATIO = 1.2;

export function MonthCalendarPager({
  entries,
  onMoveMonth,
  onSelectDate,
  selectedDate,
  visibleMonth,
}: MonthCalendarPagerProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const isAnimatingRef = useRef(false);
  const visibleMonthKeyRef = useRef<string | null>(null);
  const currentPage = useMemo(
    () => buildMonthPage(entries, visibleMonth, 0),
    [entries, visibleMonth],
  );
  const previousPage = useMemo(
    () => buildMonthPage(entries, visibleMonth, -1),
    [entries, visibleMonth],
  );
  const nextPage = useMemo(() => buildMonthPage(entries, visibleMonth, 1), [entries, visibleMonth]);
  const [activeOffset, setActiveOffset] = useState<0 | 1 | -1>(0);
  const viewportHeight = currentPage.height;

  useEffect(() => {
    if (visibleMonthKeyRef.current === currentPage.key) {
      return;
    }

    visibleMonthKeyRef.current = currentPage.key;
    translateY.setValue(0);
    setActiveOffset(0);
  }, [currentPage.key, translateY]);

  const targetPage = activeOffset === -1 ? previousPage : nextPage;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gestureState) =>
          !isAnimatingRef.current &&
          Math.abs(gestureState.dy) > SWIPE_START_DISTANCE &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * SWIPE_CAPTURE_RATIO,
        onPanResponderGrant: () => {
          translateY.stopAnimation();
        },
        onPanResponderMove: (_event, gestureState) => {
          const nextOffset = gestureState.dy === 0 ? 0 : gestureState.dy < 0 ? 1 : -1;
          setActiveOffset((currentOffset) =>
            currentOffset === nextOffset ? currentOffset : nextOffset,
          );
          translateY.setValue(clampDrag(gestureState.dy, currentPage.height));
        },
        onPanResponderRelease: (_event, gestureState) => {
          const monthOffset = resolveMonthOffset(
            gestureState.dy,
            gestureState.vy,
            currentPage.height,
          );
          if (monthOffset === 0) {
            animateTo(translateY, isAnimatingRef, 0, () => {
              setActiveOffset(0);
            });
            return;
          }

          setActiveOffset(monthOffset);
          animateTo(
            translateY,
            isAnimatingRef,
            monthOffset > 0 ? -currentPage.height : currentPage.height,
            () => {
              onMoveMonth(monthOffset);
            },
          );
        },
        onPanResponderTerminate: () => {
          animateTo(translateY, isAnimatingRef, 0, () => {
            setActiveOffset(0);
          });
        },
      }),
    [currentPage.height, onMoveMonth, translateY],
  );

  return (
    <View {...panResponder.panHandlers} style={[styles.viewport, { height: viewportHeight }]}>
      {activeOffset !== 0 ? (
        <MonthCalendarPageView
          days={targetPage.summary.days}
          isActive
          top={resolveTargetTop(activeOffset, currentPage.height, targetPage.height)}
          onSelectDate={onSelectDate}
          selectedDate={selectedDate}
          translateY={translateY}
        />
      ) : null}
      <MonthCalendarPageView
        days={currentPage.summary.days}
        isActive={activeOffset === 0}
        top={0}
        onSelectDate={onSelectDate}
        selectedDate={selectedDate}
        translateY={translateY}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
});
