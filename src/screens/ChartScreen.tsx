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
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import type { LedgerScreenState } from "../hooks/useLedgerScreenState";
import { hasSeenChartSwipeTutorial, markChartSwipeTutorialSeen } from "../lib/chartTutorialStorage";

type ChartScreenProps = {
  showsBannerAd: boolean;
  state: LedgerScreenState;
  userId: string;
};

export function ChartScreen({ showsBannerAd, state, userId }: ChartScreenProps) {
  const translateX = useSharedValue(0);

  useEffect(() => {
    void state.preloadChartEntries();
  }, [state.preloadChartEntries]);

  useEffect(() => {
    if (hasSeenChartSwipeTutorial(userId)) {
      return;
    }

    markChartSwipeTutorialSeen(userId);
    translateX.value = withDelay(
      420,
      withSequence(
        withTiming(-32, {
          duration: 300,
          reduceMotion: ReduceMotion.System,
        }),
        withTiming(32 * 0.15, {
          duration: 300,
          reduceMotion: ReduceMotion.System,
        }),
        withTiming(0, {
          duration: 300,
          reduceMotion: ReduceMotion.System,
        }),
      ),
    );
  }, [translateX, userId]);

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
          showsBannerAd={showsBannerAd}
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
