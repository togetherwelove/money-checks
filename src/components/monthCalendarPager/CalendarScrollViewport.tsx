import { useLayoutEffect, useMemo, useRef } from "react";
import { PixelRatio, ScrollView, StyleSheet, View, type ScrollViewInstance } from "react-native";

import { AppScrollBehavior } from "../../constants/scroll";
import { FullBleedHorizontalStyle } from "../../constants/uiStyles";
import { CALENDAR_MONTH_TRANSITION_HEADER_HEIGHT } from "./calendarLayout";
import { MonthCalendarSection } from "./MonthCalendarSection";
import { buildMonthSectionLayouts, CURRENT_PAGE_INDEX, resolveMonthOffsetFromScrollOffset } from "./monthCalendarScrollSnap";
import type { MonthCalendarPagerProps } from "./monthCalendarPagerTypes";
import type { MonthPage } from "./monthCalendarPagerUtils";

type Props = MonthCalendarPagerProps & {
  active: boolean;
  geometryKey: string;
  resetRevision?: number;
  pages: MonthPage[];
  onHeightChange: (key: string, height: number) => void;
};

export function CalendarScrollViewport(props: Props) {
  const { active, geometryKey, resetRevision, pages, onHeightChange } = props;
  const scrollRef = useRef<ScrollViewInstance>(null);
  const userDragged = useRef(false);
  const layouts = useMemo(() => buildMonthSectionLayouts(pages, CALENDAR_MONTH_TRANSITION_HEADER_HEIGHT), [pages]);
  const offsets = useMemo(() => layouts.map(layout => layout.snapOffset), [layouts]);
  const origin = offsets[CURRENT_PAGE_INDEX];
  const height = pages[CURRENT_PAGE_INDEX].height;

  useLayoutEffect(() => {
    userDragged.current = false;
    scrollRef.current?.scrollTo({ y: origin, animated: false });
    props.onPreviewMonthOffsetChange?.(0);
  }, [active, geometryKey, resetRevision, origin]);

  const finishScroll = (y: number) => {
    if (!active || !userDragged.current) return;
    userDragged.current = false;
    const offset = resolveMonthOffsetFromScrollOffset(y, layouts);
    props.onPreviewMonthOffsetChange?.(0);
    if (offset !== 0) props.onMoveMonth(offset);
  };

  return (
    <ScrollView {...AppScrollBehavior}
      ref={scrollRef} style={[styles.viewport, { height }]}
      contentOffset={{ x: 0, y: origin }}
      contentContainerStyle={{ paddingBottom: CALENDAR_MONTH_TRANSITION_HEADER_HEIGHT + Math.max(0, height - pages[pages.length - 1].height) }}
      contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false}
      nestedScrollEnabled scrollEnabled={active} showsVerticalScrollIndicator={false}
      snapToOffsets={offsets} decelerationRate="fast" disableIntervalMomentum
      onScrollBeginDrag={() => { userDragged.current = active; }}
      onMomentumScrollEnd={event => finishScroll(event.nativeEvent.contentOffset.y)}
      onScrollEndDrag={event => {
        const { contentOffset, velocity } = event.nativeEvent;
        // A drag ending exactly at a snap point may have no momentum event.
        if (velocity?.y === 0 && offsets.some(y => PixelRatio.getPixelSizeForLayoutSize(Math.abs(y - contentOffset.y)) === 0)) {
          finishScroll(contentOffset.y);
        }
      }}>
      {pages.map((page, index) => (
        <View key={page.key} accessibilityElementsHidden={index !== CURRENT_PAGE_INDEX}
          importantForAccessibility={index === CURRENT_PAGE_INDEX ? "auto" : "no-hide-descendants"}>
          <MonthCalendarSection page={page} isCalendarHeatmapEnabled={props.isCalendarHeatmapEnabled}
            isReadOnlyDueToPlanLimit={props.isReadOnlyDueToPlanLimit ?? false}
            onCalendarHeightChange={onHeightChange} selectedDate={props.selectedDate}
            onSelectDate={date => { if (active && index === CURRENT_PAGE_INDEX) props.onSelectDate(date); }} />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ viewport: { ...FullBleedHorizontalStyle, flexGrow: 0 } });
