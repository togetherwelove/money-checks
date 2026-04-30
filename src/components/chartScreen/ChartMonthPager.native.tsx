import { useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import PagerView from "react-native-pager-view";

import type { ChartMonthData } from "../../hooks/ledgerScreenState/types";
import { ChartMonthPageContent } from "./ChartMonthPageContent";

const CURRENT_PAGE_INDEX = 1;

type ChartMonthPagerProps = {
  currentMonth: ChartMonthData;
  nextMonth: ChartMonthData;
  onMoveMonth: (monthOffset: -1 | 1) => void;
  previousMonth: ChartMonthData;
};

type PagerViewRef = PagerView & {
  setPageWithoutAnimation?: (pageIndex: number) => void;
};

export function ChartMonthPager({
  currentMonth,
  nextMonth,
  onMoveMonth,
  previousMonth,
}: ChartMonthPagerProps) {
  const pagerViewRef = useRef<PagerViewRef | null>(null);
  const currentMonthKeyRef = useRef<string | null>(null);
  const isResettingRef = useRef(false);
  const pendingMonthOffsetRef = useRef<-1 | 0 | 1>(0);
  const [isInteractionLocked, setIsInteractionLocked] = useState(false);

  useEffect(() => {
    if (currentMonthKeyRef.current === null) {
      currentMonthKeyRef.current = currentMonth.key;
      return;
    }

    if (currentMonthKeyRef.current === currentMonth.key) {
      return;
    }

    currentMonthKeyRef.current = currentMonth.key;
    isResettingRef.current = true;
    setIsInteractionLocked(true);
    pagerViewRef.current?.setPageWithoutAnimation?.(CURRENT_PAGE_INDEX);
    requestAnimationFrame(() => {
      pendingMonthOffsetRef.current = 0;
      isResettingRef.current = false;
      setIsInteractionLocked(false);
    });
  }, [currentMonth.key]);

  return (
    <PagerView
      initialPage={CURRENT_PAGE_INDEX}
      orientation="horizontal"
      overdrag={false}
      ref={pagerViewRef}
      scrollEnabled={!isInteractionLocked}
      style={styles.pager}
      onPageSelected={(event) => {
        if (isResettingRef.current) {
          return;
        }

        const monthOffset =
          event.nativeEvent.position === 0 ? -1 : event.nativeEvent.position === 2 ? 1 : 0;
        if (monthOffset === 0 || pendingMonthOffsetRef.current !== 0) {
          return;
        }

        pendingMonthOffsetRef.current = monthOffset;
        setIsInteractionLocked(true);
        onMoveMonth(monthOffset);
      }}
    >
      <ChartMonthPageContent key={previousMonth.key} month={previousMonth} />
      <ChartMonthPageContent key={currentMonth.key} month={currentMonth} />
      <ChartMonthPageContent key={nextMonth.key} month={nextMonth} />
    </PagerView>
  );
}

const styles = StyleSheet.create({
  pager: {
    flex: 1,
    width: "100%",
  },
});
