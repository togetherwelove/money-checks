import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet } from "react-native";
import PagerView from "react-native-pager-view";

import { MonthCalendarPageView } from "./monthCalendarPager/MonthCalendarPageView";
import { CALENDAR_MAX_HEIGHT } from "./monthCalendarPager/calendarLayout";
import type { MonthCalendarPagerProps } from "./monthCalendarPager/monthCalendarPagerTypes";
import {
  type MonthPage,
  animateViewportHeight,
} from "./monthCalendarPager/monthCalendarPagerUtils";
import {
  CURRENT_PAGE_INDEX,
  resolveMonthOffsetFromPageIndex,
} from "./monthCalendarPager/monthCalendarScrollSnap";

export function MonthCalendarPager({
  currentPage,
  nextPage,
  onMoveMonth,
  onSelectDate,
  previousPage,
  selectedDate,
}: MonthCalendarPagerProps) {
  const isReadyRef = useRef(false);
  const heightAnimationRevisionRef = useRef(0);
  const pendingMonthOffsetRef = useRef<-1 | 0 | 1>(0);
  const currentPageKeyRef = useRef<string | null>(null);
  const currentPageHeightRef = useRef(currentPage.height);
  const viewportHeight = useRef(new Animated.Value(currentPage.height)).current;
  const [isInteractionLocked, setIsInteractionLocked] = useState(false);
  const currentPageKey = currentPage.key;
  const currentPageHeight = currentPage.height;

  useEffect(() => {
    if (!isReadyRef.current) {
      initializeCurrentPage(currentPageKey, currentPageHeight);
      return;
    }

    if (currentPageKeyRef.current === currentPageKey) {
      updateCurrentPageHeight(currentPageHeight);
      return;
    }

    finishMonthTransition(currentPageKey, currentPageHeight);
  }, [currentPageHeight, currentPageKey]);

  function initializeCurrentPage(pageKey: string, pageHeight: number) {
    isReadyRef.current = true;
    currentPageKeyRef.current = pageKey;
    currentPageHeightRef.current = pageHeight;
    viewportHeight.setValue(pageHeight);
  }

  function updateCurrentPageHeight(pageHeight: number) {
    animateCurrentPageHeight(pageHeight, isInteractionLocked ? completeMonthTransition : undefined);
  }

  function animateCurrentPageHeight(pageHeight: number, onComplete?: () => void) {
    const animationRevision = heightAnimationRevisionRef.current + 1;
    heightAnimationRevisionRef.current = animationRevision;

    if (currentPageHeightRef.current === pageHeight) {
      onComplete?.();
      return;
    }

    currentPageHeightRef.current = pageHeight;
    animateViewportHeight(viewportHeight, pageHeight, () => {
      if (heightAnimationRevisionRef.current === animationRevision) {
        onComplete?.();
      }
    });
  }

  function finishMonthTransition(pageKey: string, pageHeight: number) {
    currentPageKeyRef.current = pageKey;
    animateCurrentPageHeight(pageHeight, completeMonthTransition);
  }

  function completeMonthTransition() {
    pendingMonthOffsetRef.current = 0;
    setIsInteractionLocked(false);
  }

  function handlePageSelected(pageIndex: number) {
    const monthOffset = resolveMonthOffsetFromPageIndex(pageIndex);
    if (monthOffset === 0 || pendingMonthOffsetRef.current !== 0) {
      return;
    }

    pendingMonthOffsetRef.current = monthOffset;
    setIsInteractionLocked(true);
    onMoveMonth(monthOffset);
  }

  return (
    <Animated.View style={[styles.viewport, { height: viewportHeight }]}>
      <PagerView
        key={currentPageKey}
        initialPage={CURRENT_PAGE_INDEX}
        orientation="horizontal"
        overdrag={false}
        scrollEnabled={!isInteractionLocked}
        style={styles.pager}
        onPageSelected={(event) => {
          handlePageSelected(event.nativeEvent.position);
        }}
      >
        <MonthPageSlot page={previousPage} {...{ onSelectDate, selectedDate }} />
        <MonthPageSlot page={currentPage} {...{ onSelectDate, selectedDate }} />
        <MonthPageSlot page={nextPage} {...{ onSelectDate, selectedDate }} />
      </PagerView>
    </Animated.View>
  );
}

function MonthPageSlot({
  onSelectDate,
  page,
  selectedDate,
}: {
  onSelectDate: (isoDate: string) => void;
  page: MonthPage;
  selectedDate: string;
}) {
  return (
    <MonthCalendarPageView
      days={page.summary.days}
      onSelectDate={onSelectDate}
      selectedDate={selectedDate}
    />
  );
}

const styles = StyleSheet.create({
  pager: {
    flex: 1,
    width: "100%",
  },
  viewport: {
    height: CALENDAR_MAX_HEIGHT,
    overflow: "hidden",
    width: "100%",
  },
});
