import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import { StyleSheet, View } from "react-native";

import { AppLayout } from "../constants/layout";
import type { OpenReportCategoryEntries } from "../constants/allEntries";
import { getAppColors } from "../constants/colors";
import { MonthlyInsightChartCopy } from "../constants/monthlyInsightCharts";
import type { MonthlyInsights } from "../types/ledger";
import {
  MonthlyCashflowSummary,
  MonthlyCashflowTotals,
} from "./monthlyInsights/MonthlyCashflowSummary";
import { MonthlyShareBreakdown } from "./monthlyInsights/MonthlyShareBreakdown";
import { MonthlyTrendLineChart } from "./monthlyInsights/MonthlyTrendLineChart";

type MonthlyInsightsSectionProps = {
  insights: MonthlyInsights;
  scope?: "all" | "periodic";
  onOpenCategories?: OpenReportCategoryEntries;
  isActive?: boolean;
};

export function MonthlyInsightsSection({
  insights,
  scope = "periodic",
  onOpenCategories,
  isActive = true,
}: MonthlyInsightsSectionProps) {
  const styles = getStyles();
  useAppTheme();
  const previousPeriod =
    scope === "periodic"
      ? insights.comparisonBasis === "month"
        ? MonthlyInsightChartCopy.previousMonth
        : MonthlyInsightChartCopy.previousPeriod
      : undefined;

  return (
    <View style={styles.section}>
      <View style={styles.summaryContent}>
        <MonthlyCashflowTotals
          expense={insights.expenseComparison.currentAmount}
          income={insights.incomeComparison.currentAmount}
        />
      </View>
      {scope === "periodic" ? (
        <View style={styles.chartContent}>
          <MonthlyTrendLineChart
            title={
              insights.comparisonBasis === "period"
                ? MonthlyInsightChartCopy.periodTrendTitle
                : MonthlyInsightChartCopy.trendTitle
            }
            trendMonths={insights.trendMonths}
          />
        </View>
      ) : null}
      <View style={styles.summaryContent}>
        {previousPeriod ? (
          <MonthlyCashflowSummary
            dailyExpenseComparison={insights.dailyExpenseComparison}
            isActive={isActive}
            expense={insights.expenseComparison}
            previousPeriod={previousPeriod}
          />
        ) : null}
        {!previousPeriod ? <View style={styles.divider} /> : null}
        <MonthlyShareBreakdown
          categories={insights.categoryExpenses}
          members={insights.memberExpenses}
          entryType="expense"
          onOpenCategories={onOpenCategories}
        />
        <View style={styles.divider} />
        <MonthlyShareBreakdown
          categories={insights.categoryIncomes}
          members={insights.memberIncomes}
          entryType="income"
          onOpenCategories={onOpenCategories}
        />
      </View>
    </View>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: getAppColors().border,
    },
    chartContent: {
      paddingHorizontal: AppLayout.screenPadding,
    },
    summaryContent: {
      paddingHorizontal: AppLayout.screenPadding,
      gap: AppLayout.cardContentPadding,
    },
    section: {
      gap: AppLayout.cardContentPadding,
    },
  }),
);
