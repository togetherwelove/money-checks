import { useCallback, useEffect, useMemo, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { Animated, AppState, Pressable, StyleSheet, View } from "react-native";
import { AuthControls } from "../constants/authControls";
import { getAppColors } from "../constants/colors";
import { HomeScreenCopy, HomeScreenUi } from "../constants/home";
import { FullBleedHorizontalStyle } from "../constants/uiStyles";
import { useAppTheme } from "../hooks/useAppTheme";
import { useCalendarExpansion } from "../hooks/useCalendarExpansion";

import { CalendarSwipeViewport } from "./monthCalendarPager/CalendarSwipeViewport";
import {
  buildCalendarWeekNavigation,
  resolveCollapsedCalendarWeek,
} from "./monthCalendarPager/calendarWeekCount";
import type {
  CalendarWeekFrame,
  MonthCalendarPagerProps,
} from "./monthCalendarPager/monthCalendarPagerTypes";

export function MonthCalendarPager(props: MonthCalendarPagerProps) {
  useAppTheme();
  const { expanded, progress, toggle } = useCalendarExpansion();
  const isFocused = useIsFocused();
  const [isAppActive, setIsAppActive] = useState(
    AppState.currentState !== "background" && AppState.currentState !== "inactive",
  );
  const [foregroundRevision, setForegroundRevision] = useState(0);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const [weekFrames, setWeekFrames] = useState<Record<string, Record<number, CalendarWeekFrame>>>(
    {},
  );
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      // Also reset after a background/foreground pair batched into one render.
      setForegroundRevision((revision) => revision + 1);
      setIsAppActive(state === "active");
    });
    return () => subscription.remove();
  }, []);
  const monthPages = useMemo(
    () =>
      [props.previousPage, props.currentPage, props.nextPage].map((page) =>
        heights[page.key] === undefined || heights[page.key] === page.height
          ? page
          : { ...page, height: heights[page.key] },
      ),
    [props.previousPage, props.currentPage, props.nextPage, heights],
  );
  useEffect(() => {
    const keys = new Set(monthPages.map((page) => page.key));
    setHeights((current) =>
      Object.keys(current).every((key) => keys.has(key))
        ? current
        : Object.fromEntries(Object.entries(current).filter(([key]) => keys.has(key))),
    );
    setWeekFrames((current) =>
      Object.keys(current).every((key) => keys.has(key))
        ? current
        : Object.fromEntries(Object.entries(current).filter(([key]) => keys.has(key))),
    );
  }, [monthPages]);
  const onHeightChange = useCallback((key: string, height: number) => {
    if (!Number.isFinite(height) || height <= 0) return;
    setHeights((current) => (current[key] === height ? current : { ...current, [key]: height }));
  }, []);
  const onWeekLayout = useCallback((key: string, index: number, frame: CalendarWeekFrame) => {
    if (!Number.isFinite(frame.top) || !Number.isFinite(frame.height) || frame.height <= 0) return;
    setWeekFrames((current) => {
      const previous = current[key]?.[index];
      if (previous?.top === frame.top && previous.height === frame.height) return current;
      return { ...current, [key]: { ...current[key], [index]: frame } };
    });
  }, []);
  const weekNavigation = useMemo(
    () => buildCalendarWeekNavigation(monthPages, props.selectedDate),
    [monthPages, props.selectedDate],
  );
  const pages = expanded ? monthPages : weekNavigation.pages;
  const collapsedWeeks = useMemo(
    () =>
      pages.map((page, index) =>
        resolveCollapsedCalendarWeek(
          page.summary.days,
          page.height,
          (expanded ? props.selectedDate : weekNavigation.dates[index]) ?? props.selectedDate,
          weekFrames[page.key],
        ),
      ),
    [expanded, pages, props.selectedDate, weekFrames, weekNavigation.dates],
  );
  const height = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [collapsedWeeks[1].height, pages[1].height],
  });
  const active = isFocused && isAppActive;
  // Reset the native page after focus and geometry changes.
  const geometryKey = JSON.stringify([
    expanded,
    pages.map((page, index) => [
      page.key,
      page.height,
      expanded ? null : collapsedWeeks[index].index,
    ]),
  ]);
  return (
    <View>
      <Animated.View style={[styles.clippingViewport, { height }]}>
        <CalendarSwipeViewport
          {...props}
          geometryKey={geometryKey}
          active={active}
          resetRevision={foregroundRevision}
          pages={pages}
          onHeightChange={onHeightChange}
          collapsedWeeks={collapsedWeeks}
          expanded={expanded}
          expansionProgress={progress}
          weekSwipeDates={weekNavigation.dates}
          onWeekLayout={onWeekLayout}
        />
      </Animated.View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          expanded ? HomeScreenCopy.collapseCalendar : HomeScreenCopy.expandCalendar
        }
        accessibilityState={{ expanded }}
        onPress={toggle}
        style={styles.toggle}
      >
        <View
          style={[
            styles.toggleTriangle,
            { borderTopColor: getAppColors().mutedStrongText },
            expanded && styles.toggleTriangleUp,
          ]}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  clippingViewport: { ...FullBleedHorizontalStyle, overflow: "hidden" },
  toggle: { alignItems: "center", justifyContent: "center", minHeight: AuthControls.controlHeight },
  toggleTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: HomeScreenUi.calendarExpansionIconWidth / 2,
    borderRightWidth: HomeScreenUi.calendarExpansionIconWidth / 2,
    borderTopWidth: HomeScreenUi.calendarExpansionIconHeight,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  toggleTriangleUp: { transform: [{ rotate: "180deg" }] },
});
