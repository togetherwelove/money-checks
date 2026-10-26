import { useCallback, useEffect, useMemo, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { AppState } from "react-native";

import { CalendarScrollViewport } from "./monthCalendarPager/CalendarScrollViewport";
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
  // Reset the native scroll position after focus and geometry changes.
  const geometryKey = JSON.stringify(pages.map((page) => [page.key, page.height]));
  return <CalendarScrollViewport {...props} geometryKey={geometryKey} active={active} resetRevision={foregroundRevision}
    pages={pages} onHeightChange={onHeightChange} />;
}
