import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, PanResponder, StyleSheet, View } from "react-native";

import type { LedgerEntry } from "../types/ledger";
import { MonthCalendarPageView } from "./monthCalendarPager/MonthCalendarPageView";
import {
  animateTo,
  buildMonthPages,
  clampDrag,
  resolveMonthOffset,
  resolveViewportHeight,
} from "./monthCalendarPager/monthCalendarPagerUtils";

type MonthCalendarPagerProps = {
  entries: LedgerEntry[];
  onMoveMonth: (monthOffset: number) => void;
  onSelectDate: (isoDate: string) => void;
  selectedDate: string;
  visibleMonth: Date;
};

const SWIPE_START_DISTANCE = 12;

export function MonthCalendarPager({
  entries,
  onMoveMonth,
  onSelectDate,
  selectedDate,
  visibleMonth,
}: MonthCalendarPagerProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const isAnimatingRef = useRef(false);
  const monthPages = useMemo(() => buildMonthPages(entries, visibleMonth), [entries, visibleMonth]);
  const [viewportHeight, setViewportHeight] = useState(monthPages[1].height);
  const previousHeight = monthPages[0].height;
  const currentHeight = monthPages[1].height;
  const nextHeight = monthPages[2].height;

  useEffect(() => {
    if (!isAnimatingRef.current) {
      setViewportHeight(currentHeight);
    }
  }, [currentHeight]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gestureState) =>
          !isAnimatingRef.current &&
          Math.abs(gestureState.dy) > SWIPE_START_DISTANCE &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderGrant: () => {
          translateY.stopAnimation();
        },
        onPanResponderMove: (_event, gestureState) => {
          setViewportHeight(
            resolveViewportHeight(gestureState.dy, previousHeight, currentHeight, nextHeight),
          );
          translateY.setValue(
            clampDrag(gestureState.dy, previousHeight, currentHeight, nextHeight),
          );
        },
        onPanResponderRelease: (_event, gestureState) => {
          const monthOffset = resolveMonthOffset(gestureState.dy, currentHeight);
          if (monthOffset === 0) {
            animateTo(translateY, isAnimatingRef, 0, () => {
              setViewportHeight(currentHeight);
            });
            return;
          }

          const targetHeight = monthOffset > 0 ? nextHeight : previousHeight;
          setViewportHeight(Math.max(currentHeight, targetHeight));
          const targetValue = monthOffset > 0 ? -currentHeight : previousHeight;
          animateTo(translateY, isAnimatingRef, targetValue, () => {
            translateY.setValue(0);
            setViewportHeight(targetHeight);
            onMoveMonth(monthOffset);
          });
        },
        onPanResponderTerminate: () => {
          animateTo(translateY, isAnimatingRef, 0, () => {
            setViewportHeight(currentHeight);
          });
        },
      }),
    [currentHeight, nextHeight, onMoveMonth, previousHeight, translateY],
  );

  return (
    <View {...panResponder.panHandlers} style={[styles.viewport, { height: viewportHeight }]}>
      <MonthPageView
        days={monthPages[0].summary.days}
        onSelectDate={onSelectDate}
        selectedDate={selectedDate}
        top={-previousHeight}
        translateY={translateY}
      />
      <MonthPageView
        days={monthPages[1].summary.days}
        onSelectDate={onSelectDate}
        selectedDate={selectedDate}
        top={0}
        translateY={translateY}
      />
      <MonthPageView
        days={monthPages[2].summary.days}
        onSelectDate={onSelectDate}
        selectedDate={selectedDate}
        top={currentHeight}
        translateY={translateY}
      />
    </View>
  );
}

function MonthPageView({
  days,
  onSelectDate,
  selectedDate,
  top,
  translateY,
}: {
  days: ReturnType<typeof buildMonthPages>[number]["summary"]["days"];
  onSelectDate: (isoDate: string) => void;
  selectedDate: string;
  top: number;
  translateY: Animated.Value;
}) {
  return (
    <MonthCalendarPageView
      days={days}
      onSelectDate={onSelectDate}
      selectedDate={selectedDate}
      top={top}
      translateY={translateY}
    />
  );
}

const styles = StyleSheet.create({
  viewport: {
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
});
