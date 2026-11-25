import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Easing } from "react-native";
import { ExpenseMountainLayout } from "../constants/monthlyInsightCharts";

export function useExpenseChartReveal(animationKey: string, isActive: boolean) {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    progress.setValue(0);
    if (!isActive) return;

    let mounted = true;
    let reduceMotionChanged = false;
    let animation: Animated.CompositeAnimation | undefined;
    const start = (reduceMotion: boolean) => {
      if (!mounted) return;
      if (reduceMotion || reduceMotionChanged) {
        progress.setValue(1);
        return;
      }
      animation = Animated.timing(progress, {
        toValue: 1,
        duration: ExpenseMountainLayout.revealDurationMs,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      });
      animation.start();
    };
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (reduceMotion) => {
        reduceMotionChanged = reduceMotion;
        if (reduceMotion) {
          animation?.stop();
          progress.setValue(1);
        }
      },
    );
    void AccessibilityInfo.isReduceMotionEnabled().then(start, () => start(false));

    return () => {
      mounted = false;
      animation?.stop();
      subscription.remove();
    };
  }, [animationKey, isActive, progress]);

  return progress;
}
