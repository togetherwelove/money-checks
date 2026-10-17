import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { FullBleedHorizontalStyle } from "../../constants/uiStyles";
import {
  CALENDAR_DRAG_ACTIVATION_DISTANCE,
  CALENDAR_DRAG_HORIZONTAL_FAILURE_DISTANCE,
  CALENDAR_FLICK_VELOCITY_PER_SECOND,
  CALENDAR_MONTH_SNAP_FULL_DISTANCE_DURATION_MS,
  CALENDAR_MONTH_SNAP_MIN_DURATION_MS,
  CALENDAR_MONTH_TRANSITION_HEADER_HEIGHT,
} from "./calendarLayout";
import { MonthCalendarSection } from "./MonthCalendarSection";
import { buildMonthSectionLayouts, CURRENT_PAGE_INDEX, resolveMonthOffsetFromScrollOffset, resolveMonthScrollTransition } from "./monthCalendarScrollSnap";
import type { MonthCalendarPagerProps, MonthOffset } from "./monthCalendarPagerTypes";
import type { MonthPage } from "./monthCalendarPagerUtils";

type Props = MonthCalendarPagerProps & {
  active: boolean;
  pages: MonthPage[];
  onHeightChange: (key: string, height: number) => void;
};

export function CalendarGestureViewport(props: Props) {
  const { active, pages, onHeightChange } = props;
  const callbacks = useRef(props);
  callbacks.current = props;
  const layouts = useMemo(() => buildMonthSectionLayouts(pages, CALENDAR_MONTH_TRANSITION_HEADER_HEIGHT), [pages]);
  const origin = layouts[CURRENT_PAGE_INDEX].snapOffset;
  const [position] = useState(() => new Animated.Value(-origin));
  const [height] = useState(() => new Animated.Value(pages[CURRENT_PAGE_INDEX].height));
  const phase = useRef<"idle" | "dragging" | "snapping" | "committed" | "disposed">("idle");
  const animation = useRef<Animated.CompositeAnimation | null>(null);
  const revision = useRef(0);
  const preview = useRef<MonthOffset>(0);
  const offset = useRef(origin);

  const gesture = useMemo(() => {
    const updatePreview = (value: MonthOffset) => {
      if (preview.current === value) return;
      preview.current = value;
      callbacks.current.onPreviewMonthOffsetChange?.(value);
    };
    const snap = (target: MonthOffset) => {
      phase.current = "snapping";
      const session = ++revision.current;
      const targetIndex = CURRENT_PAGE_INDEX + target;
      const destination = layouts[targetIndex].snapOffset;
      const distance = Math.abs(destination - offset.current);
      const fullDistance = Math.abs(destination - origin) || layouts[CURRENT_PAGE_INDEX].length;
      const duration = Math.max(
        CALENDAR_MONTH_SNAP_MIN_DURATION_MS,
        Math.round(CALENDAR_MONTH_SNAP_FULL_DISTANCE_DURATION_MS * distance / fullDistance),
      );
      animation.current = Animated.parallel([
        Animated.timing(position, {
          toValue: -destination,
          duration,
          easing: Easing.linear, useNativeDriver: false,
        }),
        Animated.timing(height, {
          toValue: pages[targetIndex].height,
          duration,
          easing: Easing.linear, useNativeDriver: false,
        }),
      ]);
      animation.current.start(({ finished }) => {
        if (!finished || revision.current !== session || phase.current === "disposed") return;
        animation.current = null;
        offset.current = destination;
        updatePreview(target);
        phase.current = target === 0 ? "idle" : "committed";
        if (target !== 0) callbacks.current.onMoveMonth(target);
      });
    };
    const updatePosition = (translationY: number) => {
      offset.current = Math.max(layouts[0].snapOffset, Math.min(layouts[layouts.length - 1].snapOffset, origin - translationY));
      position.setValue(-offset.current);
      const transition = resolveMonthScrollTransition(offset.current, pages, layouts);
      height.setValue(transition.viewportHeight);
      updatePreview(transition.monthOffset);
    };
    return Gesture.Pan()
      .runOnJS(true)
      .enabled(active)
      .activeOffsetY([-CALENDAR_DRAG_ACTIVATION_DISTANCE, CALENDAR_DRAG_ACTIVATION_DISTANCE])
      .failOffsetX([-CALENDAR_DRAG_HORIZONTAL_FAILURE_DISTANCE, CALENDAR_DRAG_HORIZONTAL_FAILURE_DISTANCE])
      .onStart(() => {
        if (phase.current === "idle" && callbacks.current.active) phase.current = "dragging";
      })
      .onUpdate((event) => {
        if (phase.current === "dragging") updatePosition(event.translationY);
      })
      .onEnd((event) => {
        if (phase.current !== "dragging") return;
        updatePosition(event.translationY);
        const target = Math.abs(event.velocityY) >= CALENDAR_FLICK_VELOCITY_PER_SECOND
          ? (event.velocityY > 0 ? -1 : 1)
          : resolveMonthOffsetFromScrollOffset(offset.current, layouts);
        snap(target);
      })
      .onFinalize((_event, success) => {
        if (!success && phase.current === "dragging") snap(0);
      });
  }, [active, height, layouts, origin, pages, position]);

  useLayoutEffect(() => {
    phase.current = "idle";
    callbacks.current.onPreviewMonthOffsetChange?.(0);
    return () => {
      phase.current = "disposed";
      revision.current++;
      animation.current?.stop();
    };
  }, []);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View collapsable={false} style={[styles.viewport, { height }]}>
        <Animated.View style={[styles.months, { transform: [{ translateY: position }] }]}>
          {pages.map((page, index) => (
            <View key={page.key} accessibilityElementsHidden={index !== CURRENT_PAGE_INDEX} importantForAccessibility={index === CURRENT_PAGE_INDEX ? "auto" : "no-hide-descendants"}>
              <MonthCalendarSection
                page={page}
                isCalendarHeatmapEnabled={props.isCalendarHeatmapEnabled}
                isReadOnlyDueToPlanLimit={props.isReadOnlyDueToPlanLimit ?? false}
                onCalendarHeightChange={onHeightChange}
                onSelectDate={(date) => {
                  if (phase.current === "idle" && callbacks.current.active) callbacks.current.onSelectDate(date);
                }}
                selectedDate={props.selectedDate}
              />
            </View>
          ))}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  viewport: { ...FullBleedHorizontalStyle, overflow: "hidden" },
  months: { position: "absolute", top: 0, left: 0, right: 0 },
});
