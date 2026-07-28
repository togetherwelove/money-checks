import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, StyleSheet } from "react-native";
import PagerView from "react-native-pager-view";

import { FullBleedHorizontalStyle } from "../constants/uiStyles";
import { MonthCalendarPageView } from "./monthCalendarPager/MonthCalendarPageView";
import {
  CALENDAR_BOTTOM_BORDER_CLIP_PADDING,
  CALENDAR_MAX_HEIGHT,
} from "./monthCalendarPager/calendarLayout";
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
  isCalendarHeatmapEnabled,
  isReadOnlyDueToPlanLimit = false,
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
  const [measuredPageHeights, setMeasuredPageHeights] = useState<Record<string, number>>({});
  const currentPageKey = currentPage.key;
  const currentPageHeight = resolvePageHeight(currentPage);
  const handleContentHeightChange = useCallback((pageKey: string, contentHeight: number) => {
    if (!Number.isFinite(contentHeight) || contentHeight <= 0) {
      return;
    }

    const measuredHeight = Math.ceil(contentHeight + CALENDAR_BOTTOM_BORDER_CLIP_PADDING);
    setMeasuredPageHeights((currentHeights) =>
      currentHeights[pageKey] === measuredHeight
        ? currentHeights
        : { ...currentHeights, [pageKey]: measuredHeight },
    );
  }, []);

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

  useEffect(() => {
    const visiblePageKeys = new Set([previousPage.key, currentPage.key, nextPage.key]);
    setMeasuredPageHeights((currentHeights) => {
      const nextHeights = Object.fromEntries(
        Object.entries(currentHeights).filter(([pageKey]) => visiblePageKeys.has(pageKey)),
      );

      return Object.keys(nextHeights).length === Object.keys(currentHeights).length
        ? currentHeights
        : nextHeights;
    });
  }, [currentPage.key, nextPage.key, previousPage.key]);

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

  function resolvePageHeight(page: MonthPage): number {
    return measuredPageHeights[page.key] ?? page.height;
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
        <MonthPageSlot
          isCalendarHeatmapEnabled={isCalendarHeatmapEnabled}
          isReadOnlyDueToPlanLimit={isReadOnlyDueToPlanLimit}
          onContentHeightChange={handleContentHeightChange}
          page={previousPage}
          pageHeight={resolvePageHeight(previousPage)}
          {...{ onSelectDate, selectedDate }}
        />
        <MonthPageSlot
          isCalendarHeatmapEnabled={isCalendarHeatmapEnabled}
          isReadOnlyDueToPlanLimit={isReadOnlyDueToPlanLimit}
          onContentHeightChange={handleContentHeightChange}
          page={currentPage}
          pageHeight={resolvePageHeight(currentPage)}
          {...{ onSelectDate, selectedDate }}
        />
        <MonthPageSlot
          isCalendarHeatmapEnabled={isCalendarHeatmapEnabled}
          isReadOnlyDueToPlanLimit={isReadOnlyDueToPlanLimit}
          onContentHeightChange={handleContentHeightChange}
          page={nextPage}
          pageHeight={resolvePageHeight(nextPage)}
          {...{ onSelectDate, selectedDate }}
        />
      </PagerView>
    </Animated.View>
  );
}

function MonthPageSlot({
  isCalendarHeatmapEnabled,
  isReadOnlyDueToPlanLimit,
  onContentHeightChange,
  onSelectDate,
  page,
  pageHeight,
  selectedDate,
}: {
  isCalendarHeatmapEnabled: boolean;
  isReadOnlyDueToPlanLimit: boolean;
  onContentHeightChange: (pageKey: string, contentHeight: number) => void;
  onSelectDate: (isoDate: string) => void;
  page: MonthPage;
  pageHeight: number;
  selectedDate: string;
}) {
  return (
    <MonthCalendarPageView
      days={page.summary.days}
      isCalendarHeatmapEnabled={isCalendarHeatmapEnabled}
      isReadOnlyDueToPlanLimit={isReadOnlyDueToPlanLimit}
      onContentHeightChange={onContentHeightChange}
      onSelectDate={onSelectDate}
      pageHeight={pageHeight}
      pageKey={page.key}
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
    ...FullBleedHorizontalStyle,
    height: CALENDAR_MAX_HEIGHT,
    overflow: "hidden",
  },
});
