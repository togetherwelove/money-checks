import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  ReduceMotion,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from "react-native-reanimated";

const SCREEN_TRANSITION_DURATION_MS = 220;

type ScreenSlideTransitionProps = {
  children: ReactNode;
  direction?: "back" | "forward";
  screenKey: string;
};

export function ScreenSlideTransition({
  children,
  direction = "forward",
  screenKey,
}: ScreenSlideTransitionProps) {
  const enteringTransition =
    direction === "back"
      ? SlideInLeft.duration(SCREEN_TRANSITION_DURATION_MS).reduceMotion(ReduceMotion.System)
      : SlideInRight.duration(SCREEN_TRANSITION_DURATION_MS).reduceMotion(ReduceMotion.System);
  const exitingTransition =
    direction === "back"
      ? SlideOutRight.duration(SCREEN_TRANSITION_DURATION_MS).reduceMotion(ReduceMotion.System)
      : SlideOutLeft.duration(SCREEN_TRANSITION_DURATION_MS).reduceMotion(ReduceMotion.System);

  return (
    <View style={styles.container}>
      <Animated.View
        entering={enteringTransition}
        exiting={exitingTransition}
        key={screenKey}
        style={styles.layer}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
});
