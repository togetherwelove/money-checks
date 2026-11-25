import { useLayoutEffect, useRef } from "react";
import { type Animated, StyleSheet, View } from "react-native";
import PagerView from "react-native-pager-view";
import { AppPagerScrollBehavior } from "../../constants/scroll";
import type {
  CalendarWeekFrame,
  CollapsedCalendarWeek,
  MonthCalendarPagerProps,
} from "./monthCalendarPagerTypes";
import type { MonthPage } from "./monthCalendarPagerUtils";
import { MonthCalendarSection } from "./MonthCalendarSection";

const CURRENT_PAGE_INDEX = 1;
// Keep the native page views mounted when the same slots switch between weeks and months.
const PAGE_SLOTS = ["previous", "current", "next"] as const;

type Props = MonthCalendarPagerProps & {
  active: boolean;
  geometryKey: string;
  resetRevision?: number;
  pages: MonthPage[];
  onHeightChange: (key: string, height: number) => void;
  collapsedWeeks: CollapsedCalendarWeek[];
  expanded: boolean;
  expansionProgress: Animated.Value;
  onWeekLayout: (key: string, index: number, frame: CalendarWeekFrame) => void;
  weekSwipeDates: (string | undefined)[];
};

export function CalendarSwipeViewport(props: Props) {
  const { active, geometryKey, resetRevision, pages } = props;
  const pagerRef = useRef<PagerView>(null);
  const userDragged = useRef(false);
  const pendingSwipe = useRef(false);
  const pagePosition = useRef(CURRENT_PAGE_INDEX);
  const previousLifecycle = useRef({ active, resetRevision });
  const currentProps = useRef(props);
  currentProps.current = props;
  const currentPage = pages[CURRENT_PAGE_INDEX];

  useLayoutEffect(() => {
    const lifecycleChanged =
      active !== previousLifecycle.current.active ||
      resetRevision !== previousLifecycle.current.resetRevision;
    const needsRecenter =
      lifecycleChanged ||
      userDragged.current ||
      pendingSwipe.current ||
      pagePosition.current !== CURRENT_PAGE_INDEX;
    previousLifecycle.current = { active, resetRevision };
    userDragged.current = false;
    pendingSwipe.current = false;
    pagePosition.current = CURRENT_PAGE_INDEX;
    if (needsRecenter) pagerRef.current?.setPageWithoutAnimation(CURRENT_PAGE_INDEX);
  }, [active, geometryKey, resetRevision]);

  const canInteract = () =>
    currentProps.current.active &&
    currentProps.current.geometryKey === geometryKey &&
    currentProps.current.resetRevision === resetRevision;
  const finishSwipe = () => {
    if (!canInteract() || !userDragged.current || pendingSwipe.current) return;
    userDragged.current = false;
    const offset = Math.round(pagePosition.current) - CURRENT_PAGE_INDEX;
    if (offset !== -1 && offset !== 1) return;
    if (props.expanded) {
      pendingSwipe.current = true;
      props.onMoveMonth(offset);
      return;
    }
    const nextDate = props.weekSwipeDates[CURRENT_PAGE_INDEX + offset];
    if (!nextDate) {
      pagerRef.current?.setPageWithoutAnimation(CURRENT_PAGE_INDEX);
      return;
    }
    pendingSwipe.current = true;
    props.onMoveWeekDate(nextDate);
  };

  return (
    <PagerView
      key={currentPage.key}
      ref={pagerRef}
      {...AppPagerScrollBehavior}
      initialPage={CURRENT_PAGE_INDEX}
      orientation="horizontal"
      scrollEnabled={active}
      style={[styles.viewport, { height: currentPage.height }]}
      onPageScrollStateChanged={(event) => {
        if (!canInteract() || pendingSwipe.current) return;
        if (event.nativeEvent.pageScrollState === "dragging") userDragged.current = true;
        else if (event.nativeEvent.pageScrollState === "idle") finishSwipe();
      }}
      onPageScroll={(event) => {
        if (canInteract() && userDragged.current && !pendingSwipe.current) {
          pagePosition.current = event.nativeEvent.position + event.nativeEvent.offset;
        }
      }}
      onPageSelected={(event) => {
        if (!canInteract() || !userDragged.current || pendingSwipe.current) return;
        pagePosition.current = event.nativeEvent.position;
      }}
    >
      {pages.map((page, index) => (
        <View
          key={PAGE_SLOTS[index]}
          collapsable={false}
          accessibilityElementsHidden={index !== CURRENT_PAGE_INDEX}
          importantForAccessibility={index === CURRENT_PAGE_INDEX ? "auto" : "no-hide-descendants"}
        >
          <MonthCalendarSection
            page={page}
            isCalendarHeatmapEnabled={props.isCalendarHeatmapEnabled}
            isReadOnlyDueToPlanLimit={props.isReadOnlyDueToPlanLimit ?? false}
            onCalendarHeightChange={props.onHeightChange}
            selectedDate={
              props.expanded
                ? props.selectedDate
                : (props.weekSwipeDates[index] ?? props.selectedDate)
            }
            collapsedWeekIndex={props.expanded ? undefined : props.collapsedWeeks[index].index}
            translateY={props.expansionProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [-props.collapsedWeeks[index].top, 0],
            })}
            onWeekLayout={props.onWeekLayout}
            onSelectDate={(date) => {
              if (
                canInteract() &&
                !userDragged.current &&
                !pendingSwipe.current &&
                index === CURRENT_PAGE_INDEX
              )
                props.onSelectDate(date);
            }}
          />
        </View>
      ))}
    </PagerView>
  );
}

const styles = StyleSheet.create({
  // The clipped wrapper animates; the native pager keeps its full-height canvas.
  viewport: { position: "absolute", top: 0, left: 0, right: 0 },
});
