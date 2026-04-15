import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { ReduceMotion, SlideInRight, SlideOutLeft } from "react-native-reanimated";

const SCREEN_TRANSITION_DURATION_MS = 220;

type ScreenSlideTransitionProps = {
  children: ReactNode;
  screenKey: string;
};

export function ScreenSlideTransition({ children, screenKey }: ScreenSlideTransitionProps) {
  return (
    <View style={styles.container}>
      <Animated.View
        entering={SlideInRight.duration(SCREEN_TRANSITION_DURATION_MS).reduceMotion(
          ReduceMotion.System,
        )}
        exiting={SlideOutLeft.duration(SCREEN_TRANSITION_DURATION_MS).reduceMotion(
          ReduceMotion.System,
        )}
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
