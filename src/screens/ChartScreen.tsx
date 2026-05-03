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

import { AppBannerAd } from "../components/AppBannerAd";
import { ChartMonthPager } from "../components/chartScreen/ChartMonthPager";
import { ChartScreenCopy } from "../constants/chartScreen";
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import type { LedgerScreenState } from "../hooks/useLedgerScreenState";

type ChartScreenProps = {
  showsBannerAd: boolean;
  state: LedgerScreenState;
};

export function ChartScreen({ showsBannerAd, state }: ChartScreenProps) {
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
      {showsBannerAd ? (
        <View style={styles.bannerSection}>
          <AppBannerAd />
        </View>
      ) : null}
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
  bannerSection: {
    paddingHorizontal: AppLayout.screenPadding,
    paddingBottom: 0,
  },
  pagerLayer: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
});
