import { useRef } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import type { ChartMonthData } from "../../hooks/ledgerScreenState/types";
import { ChartMonthPageContent } from "./ChartMonthPageContent";

const CURRENT_PAGE_INDEX = 1;

type ChartMonthPagerProps = {
  currentMonth: ChartMonthData;
  nextMonth: ChartMonthData;
  onMoveMonth: (monthOffset: -1 | 1) => void;
  previousMonth: ChartMonthData;
};

export function ChartMonthPager({
  currentMonth,
  nextMonth,
  onMoveMonth,
  previousMonth,
}: ChartMonthPagerProps) {
  const scrollViewRef = useRef<ScrollView | null>(null);
  const isResettingRef = useRef(false);
  const pageWidthRef = useRef(0);

  return (
    <View
      style={styles.container}
      onLayout={(event) => {
        pageWidthRef.current = event.nativeEvent.layout.width;
        scrollViewRef.current?.scrollTo({
          animated: false,
          x: pageWidthRef.current * CURRENT_PAGE_INDEX,
        });
      }}
    >
      <ScrollView
        bounces={false}
        contentOffset={{ x: 0, y: 0 }}
        decelerationRate="fast"
        horizontal
        key={currentMonth.key}
        pagingEnabled
        ref={scrollViewRef}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          if (isResettingRef.current || !pageWidthRef.current) {
            return;
          }

          const pageIndex = Math.round(event.nativeEvent.contentOffset.x / pageWidthRef.current);
          const monthOffset = pageIndex === 0 ? -1 : pageIndex === 2 ? 1 : 0;
          if (monthOffset !== 0) {
            onMoveMonth(monthOffset);
          }
        }}
      >
        <Page widthRef={pageWidthRef}>
          <ChartMonthPageContent month={previousMonth} />
        </Page>
        <Page widthRef={pageWidthRef}>
          <ChartMonthPageContent month={currentMonth} />
        </Page>
        <Page widthRef={pageWidthRef}>
          <ChartMonthPageContent month={nextMonth} />
        </Page>
      </ScrollView>
    </View>
  );
}

function Page({
  children,
  widthRef,
}: {
  children: React.ReactNode;
  widthRef: React.RefObject<number>;
}) {
  return (
    <View style={[styles.page, widthRef.current ? { width: widthRef.current } : null]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  page: {
    flex: 1,
  },
});
