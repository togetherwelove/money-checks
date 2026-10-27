import { useLayoutEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import PagerView from "react-native-pager-view";
import { AppPagerScrollBehavior } from "../../constants/scroll";
import { FullBleedHorizontalStyle } from "../../constants/uiStyles";
import type { MonthCalendarPagerProps } from "./monthCalendarPagerTypes";
import type { MonthPage } from "./monthCalendarPagerUtils";
import { MonthCalendarSection } from "./MonthCalendarSection";

const CURRENT_PAGE_INDEX = 1;

type Props = MonthCalendarPagerProps & {
  active: boolean;
  geometryKey: string;
  resetRevision?: number;
  pages: MonthPage[];
  onHeightChange: (key: string, height: number) => void;
};

export function CalendarSwipeViewport(props: Props) {
  const { active, geometryKey, resetRevision, pages } = props;
  const pagerRef = useRef<PagerView>(null);
  const userDragged = useRef(false);
  const pendingMonth = useRef(false);
  const pagePosition = useRef(CURRENT_PAGE_INDEX);
  const currentProps = useRef(props);
  currentProps.current = props;
  const currentPage = pages[CURRENT_PAGE_INDEX];

  useLayoutEffect(() => {
    userDragged.current = false;
    pendingMonth.current = false;
    pagePosition.current = CURRENT_PAGE_INDEX;
    pagerRef.current?.setPageWithoutAnimation(CURRENT_PAGE_INDEX);
  }, [active, geometryKey, resetRevision]);

  const canInteract = () => currentProps.current.active && currentProps.current.geometryKey === geometryKey;
  const finishSwipe = () => {
    if (!canInteract() || !userDragged.current || pendingMonth.current) return;
    userDragged.current = false;
    const offset = Math.round(pagePosition.current) - CURRENT_PAGE_INDEX;
    if (offset !== -1 && offset !== 1) return;
    pendingMonth.current = true;
    props.onMoveMonth(offset);
  };

  return <PagerView key={currentPage.key} ref={pagerRef} {...AppPagerScrollBehavior}
    initialPage={CURRENT_PAGE_INDEX} orientation="horizontal" scrollEnabled={active}
    style={[styles.viewport, { height: currentPage.height }]}
    onPageScrollStateChanged={event => {
      if (!canInteract() || pendingMonth.current) return;
      if (event.nativeEvent.pageScrollState === "dragging") userDragged.current = true;
      else if (event.nativeEvent.pageScrollState === "idle") finishSwipe();
    }}
    onPageScroll={event => {
      if (canInteract() && userDragged.current && !pendingMonth.current) {
        pagePosition.current = event.nativeEvent.position + event.nativeEvent.offset;
      }
    }}
    onPageSelected={event => {
      if (!canInteract() || !userDragged.current || pendingMonth.current) return;
      pagePosition.current = event.nativeEvent.position;
    }}>
    {pages.map((page, index) => <View key={page.key} collapsable={false}
      accessibilityElementsHidden={index !== CURRENT_PAGE_INDEX}
      importantForAccessibility={index === CURRENT_PAGE_INDEX ? "auto" : "no-hide-descendants"}>
      <MonthCalendarSection page={page} isCalendarHeatmapEnabled={props.isCalendarHeatmapEnabled}
        isReadOnlyDueToPlanLimit={props.isReadOnlyDueToPlanLimit ?? false}
        onCalendarHeightChange={props.onHeightChange} selectedDate={props.selectedDate}
        onSelectDate={date => {
          if (canInteract() && !userDragged.current && !pendingMonth.current && index === CURRENT_PAGE_INDEX) props.onSelectDate(date);
        }} />
    </View>)}
  </PagerView>;
}

const styles = StyleSheet.create({ viewport: { ...FullBleedHorizontalStyle, flexGrow: 0 } });
