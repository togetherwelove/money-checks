import { AppPagerScrollBehavior } from "../../constants/scroll";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { StyleSheet } from "react-native";
import PagerView from "react-native-pager-view";

import type { ChartMonthData } from "../../hooks/ledgerScreenState/types";
import { ChartMonthPageContent } from "./ChartMonthPageContent";

const CURRENT_PAGE_INDEX = 1;

type ChartMonthPagerProps = {
  activeBookId?: string | null;
  currentMonth: ChartMonthData;
  nextMonth: ChartMonthData;
  onMoveMonth: (monthOffset: -1 | 1) => void;
  previousMonth: ChartMonthData;
  renderScreenTitle: (titleLabel: string) => ReactNode;
};

export function ChartMonthPager({
  activeBookId = null,
  currentMonth,
  nextMonth,
  onMoveMonth,
  previousMonth,
  renderScreenTitle,
}: ChartMonthPagerProps) {
  const currentMonthKey = currentMonth.key;
  const isFocused = useIsFocused();
  const hasUserDraggedRef = useRef(false);
  const currentMonthKeyRef = useRef(currentMonthKey);
  const pendingMonthOffsetRef = useRef<-1 | 0 | 1>(0);
  const [isInteractionLocked, setIsInteractionLocked] = useState(false);

  useEffect(() => {
    if (currentMonthKeyRef.current === currentMonthKey) {
      return;
    }

    currentMonthKeyRef.current = currentMonthKey;
    hasUserDraggedRef.current = false;
    pendingMonthOffsetRef.current = 0;
    setIsInteractionLocked(false);
  }, [currentMonthKey]);

  useEffect(() => {
    if (!isFocused) hasUserDraggedRef.current = false;
  }, [isFocused]);

  function handlePageSelected(pageIndex: number) {
    if (!isFocused || !hasUserDraggedRef.current) return;
    const monthOffset = resolveMonthOffsetFromPageIndex(pageIndex);
    if (monthOffset === 0 || pendingMonthOffsetRef.current !== 0) {
      return;
    }

    pendingMonthOffsetRef.current = monthOffset;
    hasUserDraggedRef.current = false;
    setIsInteractionLocked(true);
    onMoveMonth(monthOffset);
  }

  return (
    <PagerView
      key={currentMonthKey}
      {...AppPagerScrollBehavior}
      initialPage={CURRENT_PAGE_INDEX}
      orientation="horizontal"
      scrollEnabled={isFocused && !isInteractionLocked}
      onPageScrollStateChanged={(event) => {
        if (event.nativeEvent.pageScrollState === "dragging") {
          hasUserDraggedRef.current = isFocused;
        } else if (event.nativeEvent.pageScrollState === "idle") {
          hasUserDraggedRef.current = false;
        }
      }}
      style={styles.pager}
      onPageSelected={(event) => {
        handlePageSelected(event.nativeEvent.position);
      }}
    >
      <ChartMonthPageContent
        activeBookId={activeBookId}
        month={previousMonth}
        screenTitle={renderScreenTitle(previousMonth.title)}
      />
      <ChartMonthPageContent
        activeBookId={activeBookId}
        month={currentMonth}
        screenTitle={renderScreenTitle(currentMonth.title)}
      />
      <ChartMonthPageContent
        activeBookId={activeBookId}
        month={nextMonth}
        screenTitle={renderScreenTitle(nextMonth.title)}
      />
    </PagerView>
  );
}

function resolveMonthOffsetFromPageIndex(pageIndex: number): -1 | 0 | 1 {
  if (pageIndex === 0) {
    return -1;
  }

  if (pageIndex === 2) {
    return 1;
  }

  return 0;
}

const styles = StyleSheet.create({
  pager: {
    flex: 1,
    width: "100%",
  },
});
