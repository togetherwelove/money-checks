import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppColors } from "../../constants/colors";
import { AppLayout } from "../../constants/layout";
import type { ChartMonthData } from "../../hooks/ledgerScreenState/types";
import { MonthlyInsightsSection } from "../MonthlyInsightsSection";

type ChartMonthPageContentProps = {
  month: ChartMonthData;
  showsBannerAd: boolean;
};

export function ChartMonthPageContent({ month, showsBannerAd }: ChartMonthPageContentProps) {
  const safeAreaInsets = useSafeAreaInsets();
  const contentPaddingBottom = AppLayout.chartPageBottomPadding + safeAreaInsets.bottom;

  return (
    <View style={styles.page}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: contentPaddingBottom }]}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <MonthlyInsightsSection
          insights={month.monthlyInsights}
          scope={month.scope}
          showsBannerAd={showsBannerAd}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    minHeight: 0,
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  content: {
    paddingHorizontal: AppLayout.screenPadding,
    gap: AppLayout.cardGap,
  },
});
