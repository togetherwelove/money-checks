import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { ChartMonthPager } from "../components/chartScreen/ChartMonthPager";
import { ChartScreenCopy } from "../constants/chartScreen";
import { AppColors } from "../constants/colors";
import type { LedgerScreenState } from "../hooks/useLedgerScreenState";

type ChartScreenProps = {
  state: LedgerScreenState;
};

export function ChartScreen({ state }: ChartScreenProps) {
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withDelay(
      ChartScreenCopy.swipeHintDelayMs,
      withSequence(
        withTiming(-ChartScreenCopy.swipeHintDistance, {
          duration: ChartScreenCopy.swipeHintDurationMs,
          reduceMotion: ReduceMotion.System,
        }),
        withTiming(ChartScreenCopy.swipeHintDistance * 0.15, {
          duration: ChartScreenCopy.swipeHintDurationMs,
          reduceMotion: ReduceMotion.System,
        }),
        withTiming(0, {
          duration: ChartScreenCopy.swipeHintDurationMs,
          reduceMotion: ReduceMotion.System,
        }),
      ),
    );
  }, [translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.screen}>
      <Animated.View style={[styles.pagerLayer, animatedStyle]}>
        <ChartMonthPager
          currentMonth={state.currentChartMonth}
          nextMonth={state.nextChartMonth}
          onMoveMonth={(monthOffset) =>
            state.setVisibleMonth(
              new Date(
                state.visibleMonth.getFullYear(),
                state.visibleMonth.getMonth() + monthOffset,
                1,
              ),
            )
          }
          previousMonth={state.previousChartMonth}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  pagerLayer: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
});
