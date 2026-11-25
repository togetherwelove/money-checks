import { AppScrollBehavior } from "../../constants/scroll";
import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { AppLayout } from "../../constants/layout";
import type { OpenReportCategoryEntries } from "../../constants/allEntries";
import type { ChartMonthData } from "../../hooks/ledgerScreenState/types";
import { MonthlyInsightsSection } from "../MonthlyInsightsSection";
import { AppFooterContentInset } from "../AppFooterContentInset";

type ChartMonthPageContentProps = {
  activeBookId?: string | null;
  month: ChartMonthData;
  onOpenReportCategoryEntries?: OpenReportCategoryEntries;
  screenTitle: ReactNode;
  isActive?: boolean;
};

export function ChartMonthPageContent({
  month,
  onOpenReportCategoryEntries,
  screenTitle,
  isActive = true,
}: ChartMonthPageContentProps) {
  return (
    <View style={styles.page}>
      <ScrollView
        {...AppScrollBehavior}
        contentContainerStyle={styles.content}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <View style={styles.title}>{screenTitle}</View>
        <MonthlyInsightsSection
          isActive={isActive}
          insights={month.monthlyInsights}
          scope={month.scope}
          onOpenCategories={
            onOpenReportCategoryEntries &&
            ((categories, entryType) =>
              onOpenReportCategoryEntries(categories, entryType, month.dateRange))
          }
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
    paddingBottom: AppLayout.chartPageBottomPadding,
  },
  title: {
    paddingHorizontal: AppLayout.screenPadding,
    paddingTop: AppLayout.compactGap,
  },
});
