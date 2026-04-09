import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Animated, ScrollView, StyleSheet, View } from "react-native";

import { MonthCalendarPageView } from "./monthCalendarPager/MonthCalendarPageView";
import { CALENDAR_MAX_HEIGHT } from "./monthCalendarPager/calendarLayout";
import {
  type MonthPage,
  animateViewportHeight,
} from "./monthCalendarPager/monthCalendarPagerUtils";
import { resolveMonthOffsetFromScrollOffset } from "./monthCalendarPager/monthCalendarScrollSnap";

type MonthCalendarPagerProps = {
  currentPage: MonthPage;
  nextPage: MonthPage;
  onMoveMonth: (monthOffset: number) => void;
  onSelectDate: (isoDate: string) => void;
  previousPage: MonthPage;
  selectedDate: string;
};

const PAGE_HEIGHT = CALENDAR_MAX_HEIGHT;
const CURRENT_PAGE_INDEX = 1;

export function MonthCalendarPager({
  currentPage,
  nextPage,
  onMoveMonth,
  onSelectDate,
  previousPage,
  selectedDate,
}: MonthCalendarPagerProps) {
  const scrollViewRef = useRef<ScrollView | null>(null);
  const isReadyRef = useRef(false);
  const isResettingRef = useRef(false);
  const pendingMonthOffsetRef = useRef<-1 | 0 | 1>(0);
  const currentPageKeyRef = useRef<string | null>(null);
  const viewportHeight = useRef(new Animated.Value(currentPage.height)).current;

  useEffect(() => {
    if (!isReadyRef.current) {
      isReadyRef.current = true;
      scrollToPage(CURRENT_PAGE_INDEX, false);
      currentPageKeyRef.current = currentPage.key;
      viewportHeight.setValue(currentPage.height);
      return;
    }

    if (currentPageKeyRef.current === currentPage.key) {
      return;
    }

    currentPageKeyRef.current = currentPage.key;
    isResettingRef.current = true;
    pendingMonthOffsetRef.current = 0;
    scrollToPage(CURRENT_PAGE_INDEX, false);
    requestAnimationFrame(() => {
      isResettingRef.current = false;
      animateViewportHeight(viewportHeight, currentPage.height);
    });
  }, [currentPage.height, currentPage.key, viewportHeight]);

  const handleScrollEnd = (offsetY: number) => {
    if (isResettingRef.current) {
      return;
    }

    const monthOffset = resolveMonthOffsetFromScrollOffset(offsetY, PAGE_HEIGHT);
    if (monthOffset === 0 || pendingMonthOffsetRef.current !== 0) {
      return;
    }

    pendingMonthOffsetRef.current = monthOffset;
    onMoveMonth(monthOffset);
  };

  const scrollToPage = (pageIndex: number, animated: boolean) => {
    scrollViewRef.current?.scrollTo({
      y: pageIndex * PAGE_HEIGHT,
      animated,
    });
  };

  return (
    <Animated.View style={[styles.viewport, { height: viewportHeight }]}>
      <View style={styles.scrollFrame}>
        <ScrollView
          bounces={false}
          contentOffset={{ x: 0, y: PAGE_HEIGHT }}
          decelerationRate="fast"
          onScrollEndDrag={(event) => {
            handleScrollEnd(event.nativeEvent.contentOffset.y);
          }}
          onMomentumScrollEnd={(event) => {
            handleScrollEnd(event.nativeEvent.contentOffset.y);
          }}
          pagingEnabled
          ref={scrollViewRef}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          <PageContainer>
            <MonthCalendarPageView
              days={previousPage.summary.days}
              onSelectDate={onSelectDate}
              selectedDate={selectedDate}
            />
          </PageContainer>
          <PageContainer>
            <MonthCalendarPageView
              days={currentPage.summary.days}
              onSelectDate={onSelectDate}
              selectedDate={selectedDate}
            />
          </PageContainer>
          <PageContainer>
            <MonthCalendarPageView
              days={nextPage.summary.days}
              onSelectDate={onSelectDate}
              selectedDate={selectedDate}
            />
          </PageContainer>
        </ScrollView>
      </View>
    </Animated.View>
  );
}

function PageContainer({ children }: { children: ReactNode }) {
  return <View style={styles.page}>{children}</View>;
}

const styles = StyleSheet.create({
  viewport: {
    overflow: "hidden",
    width: "100%",
  },
  scrollFrame: {
    height: PAGE_HEIGHT,
  },
  page: {
    height: PAGE_HEIGHT,
    justifyContent: "flex-start",
  },
});
