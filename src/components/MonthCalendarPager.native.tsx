import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  View,
} from "react-native";

import { FullBleedHorizontalStyle } from "../constants/uiStyles";
import {
  CALENDAR_MAX_HEIGHT,
  CALENDAR_MONTH_SNAP_FULL_DISTANCE_DURATION_MS,
  CALENDAR_MONTH_SNAP_MIN_DURATION_MS,
  CALENDAR_MONTH_TRANSITION_HEADER_HEIGHT,
} from "./monthCalendarPager/calendarLayout";
import { MonthCalendarSection } from "./monthCalendarPager/MonthCalendarSection";
import {
  CURRENT_PAGE_INDEX,
  buildMonthSectionLayouts,
  resolveMonthOffsetFromScrollOffset,
  resolveMonthScrollTransition,
} from "./monthCalendarPager/monthCalendarScrollSnap";
import type {
  MonthCalendarPagerProps,
  MonthOffset,
} from "./monthCalendarPager/monthCalendarPagerTypes";
import type { MonthPage } from "./monthCalendarPager/monthCalendarPagerUtils";

const SCROLL_DECELERATION_RATE = 0;
const SCROLL_EVENT_THROTTLE_MS = 16;
const SCROLL_ALIGNMENT_TOLERANCE = 0.5;
const MONTH_FLICK_VELOCITY_THRESHOLD = 0.2;
const MAINTAIN_VISIBLE_CONTENT_POSITION = { minIndexForVisible: 0 } as const;

export function MonthCalendarPager({
  currentPage,
  isCalendarHeatmapEnabled,
  isReadOnlyDueToPlanLimit = false,
  nextPage,
  onMoveMonth,
  onPreviewMonthOffsetChange,
  onSelectDate,
  previousPage,
  selectedDate,
}: MonthCalendarPagerProps) {
  const listRef = useRef<FlatList<MonthPage>>(null);
  const hasInitializedScrollRef = useRef(false);
  const pendingMonthOffsetRef = useRef<MonthOffset>(0);
  const previewMonthOffsetRef = useRef<MonthOffset>(0);
  const currentPageKeyRef = useRef(currentPage.key);
  const viewportHeight = useRef(new Animated.Value(currentPage.height)).current;
  const [isInteractionLocked, setIsInteractionLocked] = useState(false);
  const [measuredPageHeights, setMeasuredPageHeights] = useState<Record<string, number>>({});
  const sourcePages = useMemo(
    () => [previousPage, currentPage, nextPage],
    [currentPage, nextPage, previousPage],
  );
  const pages = useMemo(
    () =>
      sourcePages.map((page) => {
        const measuredHeight = measuredPageHeights[page.key];
        return measuredHeight === undefined || measuredHeight === page.height
          ? page
          : { ...page, height: measuredHeight };
      }),
    [measuredPageHeights, sourcePages],
  );
  const sectionLayouts = useMemo(
    () => buildMonthSectionLayouts(pages, CALENDAR_MONTH_TRANSITION_HEADER_HEIGHT),
    [pages],
  );
  const currentMonthScrollOffset = sectionLayouts[CURRENT_PAGE_INDEX].snapOffset;
  const initialContentOffset = useRef({ x: 0, y: currentMonthScrollOffset }).current;
  const snapScrollOffset = useRef(new Animated.Value(currentMonthScrollOffset)).current;
  const snapAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const resolvedCurrentPage = pages[CURRENT_PAGE_INDEX];
  const hasMeasuredAllPages = sourcePages.every(
    (page) => measuredPageHeights[page.key] !== undefined,
  );

  const handleCalendarHeightChange = useCallback((pageKey: string, contentHeight: number) => {
    if (!Number.isFinite(contentHeight) || contentHeight <= 0) {
      return;
    }

    const measuredHeight = contentHeight;
    setMeasuredPageHeights((currentHeights) =>
      currentHeights[pageKey] === measuredHeight
        ? currentHeights
        : { ...currentHeights, [pageKey]: measuredHeight },
    );
  }, []);

  const updatePreviewMonthOffset = useCallback(
    (monthOffset: MonthOffset) => {
      if (previewMonthOffsetRef.current === monthOffset) {
        return;
      }

      previewMonthOffsetRef.current = monthOffset;
      onPreviewMonthOffsetChange?.(monthOffset);
    },
    [onPreviewMonthOffsetChange],
  );

  const finishMonthSnap = useCallback(
    (monthOffset: MonthOffset) => {
      snapAnimationRef.current = null;
      viewportHeight.setValue(pages[CURRENT_PAGE_INDEX + monthOffset].height);
      updatePreviewMonthOffset(monthOffset);

      if (monthOffset === 0) {
        pendingMonthOffsetRef.current = 0;
        setIsInteractionLocked(false);
        return;
      }

      pendingMonthOffsetRef.current = monthOffset;
      onMoveMonth(monthOffset);
    },
    [onMoveMonth, pages, updatePreviewMonthOffset, viewportHeight],
  );

  useEffect(() => {
    const listenerId = snapScrollOffset.addListener(({ value }) => {
      listRef.current?.scrollToOffset({
        animated: false,
        offset: value,
      });
    });

    return () => {
      snapAnimationRef.current?.stop();
      snapScrollOffset.removeListener(listenerId);
    };
  }, [snapScrollOffset]);

  useEffect(() => {
    viewportHeight.setValue(resolvedCurrentPage.height);
    if (currentPageKeyRef.current === resolvedCurrentPage.key) {
      return;
    }

    currentPageKeyRef.current = resolvedCurrentPage.key;
    pendingMonthOffsetRef.current = 0;
    previewMonthOffsetRef.current = 0;
    setIsInteractionLocked(false);
    onPreviewMonthOffsetChange?.(0);
  }, [
    onPreviewMonthOffsetChange,
    resolvedCurrentPage.height,
    resolvedCurrentPage.key,
    viewportHeight,
  ]);

  useEffect(() => {
    const visiblePageKeys = new Set(sourcePages.map((page) => page.key));
    setMeasuredPageHeights((currentHeights) => {
      const nextHeights = Object.fromEntries(
        Object.entries(currentHeights).filter(([pageKey]) => visiblePageKeys.has(pageKey)),
      );

      return Object.keys(nextHeights).length === Object.keys(currentHeights).length
        ? currentHeights
        : nextHeights;
    });
  }, [sourcePages]);

  useEffect(() => {
    if (hasInitializedScrollRef.current || !hasMeasuredAllPages) {
      return;
    }

    const animationFrame = requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        animated: false,
        offset: currentMonthScrollOffset,
      });
      hasInitializedScrollRef.current = true;
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [currentMonthScrollOffset, hasMeasuredAllPages]);

  const getItemLayout = useCallback(
    (_data: ArrayLike<MonthPage> | null | undefined, index: number) => sectionLayouts[index],
    [sectionLayouts],
  );

  const handleScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (pendingMonthOffsetRef.current !== 0) {
        return;
      }

      const monthOffset = resolveMonthOffsetFromScrollOffset(
        event.nativeEvent.contentOffset.y,
        sectionLayouts,
      );
      const scrollOffset = event.nativeEvent.contentOffset.y;
      const resolvedMonthOffset = resolveReleasedMonthOffset(
        monthOffset,
        event.nativeEvent.velocity?.y ?? 0,
      );
      const targetScrollOffset =
        sectionLayouts[CURRENT_PAGE_INDEX + resolvedMonthOffset].snapOffset;
      const remainingDistance = Math.abs(targetScrollOffset - scrollOffset);

      setIsInteractionLocked(true);
      snapAnimationRef.current?.stop();
      snapScrollOffset.setValue(scrollOffset);

      if (remainingDistance <= SCROLL_ALIGNMENT_TOLERANCE) {
        finishMonthSnap(resolvedMonthOffset);
        return;
      }

      const snapDuration = resolveMonthSnapDuration(
        remainingDistance,
        sectionLayouts,
        resolvedMonthOffset,
      );
      const animation = Animated.parallel([
        Animated.timing(snapScrollOffset, {
          duration: snapDuration,
          easing: Easing.linear,
          toValue: targetScrollOffset,
          useNativeDriver: false,
        }),
        Animated.timing(viewportHeight, {
          duration: snapDuration,
          easing: Easing.linear,
          toValue: pages[CURRENT_PAGE_INDEX + resolvedMonthOffset].height,
          useNativeDriver: false,
        }),
      ]);
      snapAnimationRef.current = animation;
      animation.start(({ finished }) => {
        if (finished) {
          finishMonthSnap(resolvedMonthOffset);
        }
      });
    },
    [finishMonthSnap, pages, sectionLayouts, snapScrollOffset, viewportHeight],
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const transition = resolveMonthScrollTransition(
        event.nativeEvent.contentOffset.y,
        pages,
        sectionLayouts,
      );
      updatePreviewMonthOffset(transition.monthOffset);
    },
    [pages, sectionLayouts, updatePreviewMonthOffset],
  );

  const handleContentSizeChange = useCallback(() => {
    if (hasInitializedScrollRef.current) {
      return;
    }

    listRef.current?.scrollToOffset({
      animated: false,
      offset: currentMonthScrollOffset,
    });
  }, [currentMonthScrollOffset]);

  const renderMonthSection = useCallback(
    ({ item }: { item: MonthPage }) => (
      <MonthCalendarSection
        isCalendarHeatmapEnabled={isCalendarHeatmapEnabled}
        isReadOnlyDueToPlanLimit={isReadOnlyDueToPlanLimit}
        onCalendarHeightChange={handleCalendarHeightChange}
        onSelectDate={onSelectDate}
        page={item}
        selectedDate={selectedDate}
      />
    ),
    [
      isCalendarHeatmapEnabled,
      isReadOnlyDueToPlanLimit,
      handleCalendarHeightChange,
      onSelectDate,
      selectedDate,
    ],
  );

  return (
    <Animated.View style={[styles.viewport, { height: viewportHeight }]}>
      <FlatList
        bounces={false}
        contentInsetAdjustmentBehavior="never"
        contentOffset={initialContentOffset}
        data={pages}
        decelerationRate={SCROLL_DECELERATION_RATE}
        directionalLockEnabled
        getItemLayout={getItemLayout}
        initialNumToRender={pages.length}
        keyExtractor={(page) => page.key}
        ListFooterComponent={CalendarScrollFooter}
        maintainVisibleContentPosition={MAINTAIN_VISIBLE_CONTENT_POSITION}
        nestedScrollEnabled
        onContentSizeChange={handleContentSizeChange}
        onScroll={handleScroll}
        onScrollEndDrag={handleScrollEndDrag}
        overScrollMode="never"
        ref={listRef}
        removeClippedSubviews={false}
        renderItem={renderMonthSection}
        scrollEnabled={!isInteractionLocked}
        scrollEventThrottle={SCROLL_EVENT_THROTTLE_MS}
        showsVerticalScrollIndicator={false}
        style={styles.list}
        windowSize={pages.length}
      />
    </Animated.View>
  );
}

function resolveMonthSnapDuration(
  remainingDistance: number,
  sectionLayouts: ReturnType<typeof buildMonthSectionLayouts>,
  monthOffset: MonthOffset,
): number {
  const fullTransitionDistance = Math.abs(
    sectionLayouts[CURRENT_PAGE_INDEX + monthOffset].snapOffset -
      sectionLayouts[CURRENT_PAGE_INDEX].snapOffset,
  );
  const distanceRatio =
    fullTransitionDistance > 0 ? remainingDistance / fullTransitionDistance : 0;

  return Math.max(
    CALENDAR_MONTH_SNAP_MIN_DURATION_MS,
    Math.round(CALENDAR_MONTH_SNAP_FULL_DISTANCE_DURATION_MS * distanceRatio),
  );
}

function resolveReleasedMonthOffset(
  distanceBasedMonthOffset: MonthOffset,
  verticalVelocity: number,
): MonthOffset {
  if (Math.abs(verticalVelocity) < MONTH_FLICK_VELOCITY_THRESHOLD) {
    return distanceBasedMonthOffset;
  }

  return verticalVelocity > 0 ? 1 : -1;
}

function CalendarScrollFooter() {
  return <View style={styles.scrollFooter} />;
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    width: "100%",
  },
  scrollFooter: {
    height: CALENDAR_MAX_HEIGHT,
  },
  viewport: {
    ...FullBleedHorizontalStyle,
    overflow: "hidden",
  },
});
