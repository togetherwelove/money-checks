import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Easing } from "react-native";
import { HomeScreenUi } from "../constants/home";

export function useCalendarExpansion() {
  const [expanded, setExpanded] = useState(false);
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let active = true;
    const animate = (reduceMotion: boolean) => {
      if (!active) return;
      Animated.timing(progress, {
        toValue: expanded ? 1 : 0,
        duration: reduceMotion ? 0 : HomeScreenUi.calendarExpansionDurationMs,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
        isInteraction: false,
      }).start();
    };
    void AccessibilityInfo.isReduceMotionEnabled().then(animate, () => animate(false));
    return () => {
      active = false;
      progress.stopAnimation();
    };
  }, [expanded, progress]);

  return { expanded, progress, toggle: () => setExpanded((value) => !value) };
}
