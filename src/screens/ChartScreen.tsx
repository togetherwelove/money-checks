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
import { ChartMonthPageContent } from "../components/chartScreen/ChartMonthPageContent";
import { AppColors } from "../constants/colors";
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
    if (state.currentChartMonth.scope === "all") {
      return;
    }

    void state.preloadChartEntries();
  }, [state.currentChartMonth.scope, state.preloadChartEntries]);

  useEffect(() => {
    if (state.currentChartMonth.scope === "all") {
      return;
    }

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
  }, [state.currentChartMonth.scope, translateX, userId]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.screen}>
      {state.currentChartMonth.scope === "all" ? (
        <ChartMonthPageContent
          activeBookId={state.activeBook?.id ?? null}
          month={state.currentChartMonth}
          showsBannerAd={showsBannerAd}
        />
      ) : (
        <Animated.View style={[styles.pagerLayer, animatedStyle]}>
          <ChartMonthPager
            activeBookId={state.activeBook?.id ?? null}
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pagerLayer: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: AppColors.financialScreenBackground,
  },
});
