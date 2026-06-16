import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { MonthlyInsightChartCopy } from "../constants/monthlyInsightCharts";
import type { MonthlyInsights } from "../types/ledger";
import { AppBannerAd } from "./AppBannerAd";
import { MonthlyBreakdownDonutChart } from "./monthlyInsights/MonthlyBreakdownDonutChart";
import { MonthlyComparisonSection } from "./monthlyInsights/MonthlyComparisonSection";
import { MonthlyTrendBarChart } from "./monthlyInsights/MonthlyTrendBarChart";

type MonthlyInsightsSectionProps = {
  insights: MonthlyInsights;
  showsBannerAd?: boolean;
};

type BreakdownMode = "category" | "member";

export function MonthlyInsightsSection({
  insights,
  showsBannerAd = false,
}: MonthlyInsightsSectionProps) {
  const [breakdownMode, setBreakdownMode] = useState<BreakdownMode>("category");
  const [incomeBreakdownMode, setIncomeBreakdownMode] = useState<BreakdownMode>("category");
  const isCategoryMode = breakdownMode === "category";
  const isIncomeCategoryMode = incomeBreakdownMode === "category";
  const breakdownItems = isCategoryMode
    ? insights.categoryExpenses.map((item) => ({
        amount: item.amount,
        label: item.category,
        share: item.share,
      }))
    : insights.memberExpenses.map((item) => ({
        amount: item.amount,
        label: item.memberName,
        share: item.share,
      }));
  const incomeBreakdownItems = isIncomeCategoryMode
    ? insights.categoryIncomes.map((item) => ({
        amount: item.amount,
        label: item.category,
        share: item.share,
      }))
    : insights.memberIncomes.map((item) => ({
        amount: item.amount,
        label: item.memberName,
        share: item.share,
      }));

  return (
    <View style={styles.section}>
      <MonthlyComparisonSection insights={insights} />
      <MonthlyTrendBarChart trendMonths={insights.trendMonths} />
      {showsBannerAd ? (
        <View style={styles.adPanel}>
          <AppBannerAd variant="embedded" />
        </View>
      ) : null}
      <View style={styles.breakdownSection}>
        <MonthlyBreakdownDonutChart
          centerLabel={MonthlyInsightChartCopy.totalExpenseLabel}
          emptyMessage={
            isCategoryMode
              ? MonthlyInsightChartCopy.categoryEmpty
              : MonthlyInsightChartCopy.memberEmpty
          }
          items={breakdownItems}
          title={
            isCategoryMode
              ? MonthlyInsightChartCopy.categoryTitle
              : MonthlyInsightChartCopy.memberTitle
          }
        />
        <View style={styles.segmentedControl}>
          <SegmentButton
            isSelected={isCategoryMode}
            label={MonthlyInsightChartCopy.breakdownCategoryLabel}
            onPress={() => setBreakdownMode("category")}
          />
          <SegmentButton
            isSelected={!isCategoryMode}
            label={MonthlyInsightChartCopy.breakdownMemberLabel}
            onPress={() => setBreakdownMode("member")}
          />
        </View>
      </View>
      <View style={styles.breakdownSection}>
        <MonthlyBreakdownDonutChart
          centerLabel={MonthlyInsightChartCopy.totalIncomeLabel}
          emptyMessage={
            isIncomeCategoryMode
              ? MonthlyInsightChartCopy.incomeCategoryEmpty
              : MonthlyInsightChartCopy.incomeMemberEmpty
          }
          items={incomeBreakdownItems}
          title={
            isIncomeCategoryMode
              ? MonthlyInsightChartCopy.incomeCategoryTitle
              : MonthlyInsightChartCopy.incomeMemberTitle
          }
        />
        <View style={styles.segmentedControl}>
          <SegmentButton
            isSelected={isIncomeCategoryMode}
            label={MonthlyInsightChartCopy.breakdownCategoryLabel}
            onPress={() => setIncomeBreakdownMode("category")}
          />
          <SegmentButton
            isSelected={!isIncomeCategoryMode}
            label={MonthlyInsightChartCopy.breakdownMemberLabel}
            onPress={() => setIncomeBreakdownMode("member")}
          />
        </View>
      </View>
    </View>
  );
}

function SegmentButton({
  isSelected,
  label,
  onPress,
}: {
  isSelected: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={[styles.segmentButton, isSelected ? styles.segmentButtonSelected : null]}
    >
      <Text style={[styles.segmentText, isSelected ? styles.segmentTextSelected : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  adPanel: {
    backgroundColor: AppColors.surfaceMuted,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  breakdownSection: {
    gap: 10,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  segmentButtonSelected: {
    backgroundColor: AppColors.primary,
  },
  segmentText: {
    color: AppColors.mutedText,
    fontSize: 12,
    fontWeight: "700",
  },
  segmentTextSelected: {
    color: AppColors.inverseText,
  },
  segmentedControl: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 10,
    backgroundColor: AppColors.surfaceMuted,
    padding: 3,
    flexDirection: "row",
  },
  section: {
    paddingTop: AppLayout.screenTopPadding,
    gap: AppLayout.cardGap,
  },
});
