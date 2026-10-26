import { AppBannerAd } from "../components/AppBannerAd";
import { ScreenLoadingOverlay } from "../components/ScreenLoadingOverlay";
import { type ReactNode, useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ChartMonthPager } from "../components/chartScreen/ChartMonthPager";
import { ChartMonthPageContent } from "../components/chartScreen/ChartMonthPageContent";
import { AppColors } from "../constants/colors";
import type { LedgerScreenState } from "../hooks/useLedgerScreenState";
import { MonthlyInsightChartCopy } from "../constants/monthlyInsightCharts";

type ChartScreenProps = {
  renderScreenTitle: (titleLabel: string) => ReactNode;
  showsBannerAd: boolean;
  state: LedgerScreenState;
};

export function ChartScreen({
  renderScreenTitle,
  showsBannerAd,
  state,
}: ChartScreenProps) {
  const bannerAd = useMemo(() => showsBannerAd ? <AppBannerAd /> : null, [showsBannerAd]);

  useEffect(() => {
    if (state.currentChartMonth.scope === "all") {
      return;
    }

    void state.preloadChartEntries();
  }, [state.currentChartMonth.scope, state.preloadChartEntries]);

  return (
    <View style={styles.screen}>
      <View style={styles.adSlot}>{bannerAd}</View>
      {state.currentChartMonth.scope === "all" ? (
        <ChartMonthPageContent
          activeBookId={state.activeBook?.id ?? null}
          month={state.currentChartMonth}
          screenTitle={renderScreenTitle(state.currentChartMonth.title)}
        />
      ) : (
        <View style={styles.pagerLayer}>
          <Text style={styles.swipeHint}>{MonthlyInsightChartCopy.swipeHint}</Text>
          <ChartMonthPager
            activeBookId={state.activeBook?.id ?? null}
            currentMonth={state.currentChartMonth}
            nextMonth={state.nextChartMonth}
            onMoveMonth={(monthOffset) =>
              state.setVisibleChartMonth(
                new Date(
                  state.visibleChartMonth.getFullYear(),
                  state.visibleChartMonth.getMonth() + monthOffset,
                  1,
                ),
              )
            }
            previousMonth={state.previousChartMonth}
            renderScreenTitle={renderScreenTitle}
          />
        </View>
      )}
      {state.isLoading || state.isLoadingChartEntries ||
        (state.currentChartMonth.scope === "all" && state.isLoadingTotalSummary) ? <ScreenLoadingOverlay /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  swipeHint: { color: AppColors.mutedText, textAlign: "center" },
  adSlot: { flexShrink: 0 },
  pagerLayer: {
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
  },
  screen: {
    flex: 1,
    backgroundColor: AppColors.screenBackground,
  },
});
