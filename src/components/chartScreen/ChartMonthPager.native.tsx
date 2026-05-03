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

export function ChartMonthPager({
  currentMonth,
  nextMonth,
  onMoveMonth,
  previousMonth,
}: ChartMonthPagerProps) {
  const currentMonthKey = currentMonth.key;
  const currentMonthKeyRef = useRef(currentMonthKey);
  const pendingMonthOffsetRef = useRef<-1 | 0 | 1>(0);
  const [isInteractionLocked, setIsInteractionLocked] = useState(false);

  useEffect(() => {
    if (currentMonthKeyRef.current === currentMonthKey) {
      return;
    }

    currentMonthKeyRef.current = currentMonthKey;
    pendingMonthOffsetRef.current = 0;
    setIsInteractionLocked(false);
  }, [currentMonthKey]);

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
    <PagerView
      key={currentMonthKey}
      initialPage={CURRENT_PAGE_INDEX}
      orientation="horizontal"
      overdrag={false}
      scrollEnabled={!isInteractionLocked}
      style={styles.pager}
      onPageSelected={(event) => {
        handlePageSelected(event.nativeEvent.position);
      }}
    >
      <ChartMonthPageContent month={previousMonth} />
      <ChartMonthPageContent month={currentMonth} />
      <ChartMonthPageContent month={nextMonth} />
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
