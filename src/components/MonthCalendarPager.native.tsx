import { useCallback, useEffect, useMemo, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { AppState } from "react-native";

import { CalendarGestureViewport } from "./monthCalendarPager/CalendarGestureViewport";
import type { MonthCalendarPagerProps } from "./monthCalendarPager/monthCalendarPagerTypes";

export function MonthCalendarPager(props: MonthCalendarPagerProps) {
  const isFocused = useIsFocused();
  const [isAppActive, setIsAppActive] = useState(AppState.currentState !== "background" && AppState.currentState !== "inactive");
  const [foregroundRevision, setForegroundRevision] = useState(0);
  const [heights, setHeights] = useState<Record<string, number>>({});
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      // Also reset after a background/foreground pair batched into one render.
      setForegroundRevision((revision) => revision + 1);
      setIsAppActive(state === "active");
    });
    return () => subscription.remove();
  }, []);
  const pages = useMemo(() => [props.previousPage, props.currentPage, props.nextPage].map(
    (page) => heights[page.key] === undefined || heights[page.key] === page.height
      ? page : { ...page, height: heights[page.key] },
  ), [props.previousPage, props.currentPage, props.nextPage, heights]);
  useEffect(() => {
    const keys = new Set(pages.map((page) => page.key));
    setHeights((current) => Object.keys(current).every((key) => keys.has(key)) ? current
      : Object.fromEntries(Object.entries(current).filter(([key]) => keys.has(key))));
  }, [pages]);
  const onHeightChange = useCallback((key: string, height: number) => {
    if (!Number.isFinite(height) || height <= 0) return;
    setHeights((current) => current[key] === height ? current : { ...current, [key]: height });
  }, []);
  const active = isFocused && isAppActive;
  // A new coordinate system gets a fresh transform in the very same commit.
  // Menu renders and data updates within a month retain the gesture viewport.
  const geometryKey = JSON.stringify([active, foregroundRevision, pages.map((page) => [page.key, page.height])]);
  return <CalendarGestureViewport key={geometryKey} {...props} active={active} pages={pages} onHeightChange={onHeightChange} />;
}
