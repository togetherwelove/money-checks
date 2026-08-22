import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { AppLayout } from "../../constants/layout";
import type { ChartMonthData } from "../../hooks/ledgerScreenState/types";
import { MonthlyInsightsSection } from "../MonthlyInsightsSection";
import { AppFooterContentInset } from "../AppFooterContentInset";

type ChartMonthPageContentProps = {
  activeBookId?: string | null;
  month: ChartMonthData;
  screenTitle: ReactNode;
  showsBannerAd: boolean;
};

export function ChartMonthPageContent({
  activeBookId = null,
  month,
  screenTitle,
  showsBannerAd,
}: ChartMonthPageContentProps) {
  return (
    <View style={styles.page}>
      <ScrollView
        contentContainerStyle={styles.content}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <View style={styles.title}>{screenTitle}</View>
        <MonthlyInsightsSection
          activeBookId={activeBookId}
          insights={month.monthlyInsights}
          scope={month.scope}
          showsBannerAd={showsBannerAd}
        />
        <AppFooterContentInset />
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
    gap: AppLayout.cardGap,
    paddingBottom: AppLayout.chartPageBottomPadding,
  },
  title: {
    paddingHorizontal: AppLayout.screenPadding,
    paddingTop: AppLayout.screenTopPadding,
  },
});
