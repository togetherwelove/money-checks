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

type PagerViewRef = PagerView & {
  setPageWithoutAnimation?: (pageIndex: number) => void;
};

export function MonthCalendarPager({
  currentPage,
  nextPage,
  onMoveMonth,
  onSelectDate,
  previousPage,
  selectedDate,
}: MonthCalendarPagerProps) {
  const pagerViewRef = useRef<PagerViewRef | null>(null);
  const isReadyRef = useRef(false);
  const isResettingRef = useRef(false);
  const resetFrameCountRef = useRef(0);
  const pendingMonthOffsetRef = useRef<-1 | 0 | 1>(0);
  const currentPageKeyRef = useRef<string | null>(null);
  const viewportHeight = useRef(new Animated.Value(currentPage.height)).current;
  const [isInteractionLocked, setIsInteractionLocked] = useState(false);

  useEffect(() => {
    if (!isReadyRef.current) {
      isReadyRef.current = true;
      currentPageKeyRef.current = currentPage.key;
      viewportHeight.setValue(currentPage.height);
      return;
    }

    if (currentPageKeyRef.current === currentPage.key) {
      return;
    }

    currentPageKeyRef.current = currentPage.key;
    isResettingRef.current = true;
    resetFrameCountRef.current += 1;
    const resetFrameCount = resetFrameCountRef.current;
    setIsInteractionLocked(true);
    pagerViewRef.current?.setPageWithoutAnimation?.(CURRENT_PAGE_INDEX);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (resetFrameCountRef.current !== resetFrameCount) {
          return;
        }

        animateViewportHeight(viewportHeight, currentPage.height, () => {
          pendingMonthOffsetRef.current = 0;
          isResettingRef.current = false;
          setIsInteractionLocked(false);
        });
      });
    });
  }, [currentPage.height, currentPage.key, viewportHeight]);

  return (
    <Animated.View style={[styles.viewport, { height: viewportHeight }]}>
      <PagerView
        initialPage={CURRENT_PAGE_INDEX}
        orientation="vertical"
        overdrag={false}
        ref={pagerViewRef}
        scrollEnabled={!isInteractionLocked}
        style={styles.pager}
        onPageSelected={(event) => {
          if (isResettingRef.current) {
            return;
          }
          const monthOffset = resolveMonthOffsetFromPageIndex(event.nativeEvent.position);
          if (monthOffset === 0 || pendingMonthOffsetRef.current !== 0) {
            return;
          }
          pendingMonthOffsetRef.current = monthOffset;
          setIsInteractionLocked(true);
          onMoveMonth(monthOffset);
        }}
      >
        <MonthPageSlot
          key={previousPage.key}
          page={previousPage}
          {...{ onSelectDate, selectedDate }}
        />
        <MonthPageSlot
          key={currentPage.key}
          page={currentPage}
          {...{ onSelectDate, selectedDate }}
        />
        <MonthPageSlot key={nextPage.key} page={nextPage} {...{ onSelectDate, selectedDate }} />
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
