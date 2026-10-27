import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Easing } from "react-native";
import { ClipboardPromptUi } from "../constants/cardSmsClipboard";

export function useClipboardExpansionAnimation(expanded: boolean) {
  const [progress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    let active = true;
    let animation: Animated.CompositeAnimation | undefined;
    const start = (reduceMotion: boolean) => {
      if (!active) return;
      animation = Animated.timing(progress, {
        toValue: expanded ? 1 : 0,
        duration: reduceMotion ? 0 : ClipboardPromptUi.animationDurationMs,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      });
      animation.start();
    };
    void AccessibilityInfo.isReduceMotionEnabled().then(start, () => start(false));
    return () => { active = false; animation?.stop(); };
  }, [expanded, progress]);
  return progress;
}
