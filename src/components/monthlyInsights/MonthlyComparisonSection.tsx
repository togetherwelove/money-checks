import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../../constants/colors";
import {
  MonthlyComparisonLayout,
  MonthlyInsightChartCopy,
} from "../../constants/monthlyInsightCharts";
import {
  type MonthlyComparisonTone,
  buildMonthlyComparisonSummary,
} from "../../lib/monthlyComparisonSummary";
import type { MonthlyComparisonMetric, MonthlyInsights } from "../../types/ledger";

type MonthlyComparisonSectionProps = {
  insights: MonthlyInsights;
};

type ComparisonCardProps = {
  comparison: MonthlyComparisonMetric;
  comparisonBasis: MonthlyInsights["comparisonBasis"];
  previousMonthLabel: string;
  variant: "expense" | "income";
};

export function MonthlyComparisonSection({ insights }: MonthlyComparisonSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.comparisonList}>
        <ComparisonRow
          comparison={insights.incomeComparison}
          comparisonBasis={insights.comparisonBasis}
          previousMonthLabel={insights.previousMonthLabel}
          variant="income"
        />
        <View style={styles.divider} />
        <ComparisonRow
          comparison={insights.expenseComparison}
          comparisonBasis={insights.comparisonBasis}
          previousMonthLabel={insights.previousMonthLabel}
          variant="expense"
        />
      </View>
    </View>
  );
}

function ComparisonRow({
  comparison,
  comparisonBasis,
  previousMonthLabel,
  variant,
}: ComparisonCardProps) {
  const summary = buildMonthlyComparisonSummary(
    comparison,
    previousMonthLabel,
    variant,
    comparisonBasis,
  );
  const variantLabel =
    variant === "income"
      ? MonthlyInsightChartCopy.incomeLabel
      : MonthlyInsightChartCopy.expenseLabel;

  return (
    <View style={styles.comparisonRow}>
      <View
        style={[styles.metricRail, variant === "income" ? styles.incomeRail : styles.expenseRail]}
      />
      <View style={styles.comparisonBody}>
        <View style={styles.comparisonHeader}>
          <Text
            style={[
              styles.metricLabel,
              variant === "income" ? styles.incomeText : styles.expenseText,
            ]}
          >
            {variantLabel}
          </Text>
          <Text numberOfLines={1} style={styles.previousAmount}>
            {summary.previousAmountLabel}
          </Text>
        </View>
        <Text style={[
          styles.currentAmount,
          variant === "income" ? styles.incomeText : styles.expenseText,
        ]}>{summary.currentAmountLabel}</Text>
        {/* <Text style={styles.comparisonSentence}>
          {summary.comparisonSentence}
        </Text> */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  comparisonList: {
    gap: MonthlyComparisonLayout.listGap,
  },
  comparisonRow: {
    flexDirection: "row",
    gap: MonthlyComparisonLayout.rowGap,
    paddingHorizontal: MonthlyComparisonLayout.rowPaddingHorizontal,
    paddingVertical: MonthlyComparisonLayout.rowPaddingVertical,
  },
  metricRail: {
    alignSelf: "stretch",
    borderRadius: MonthlyComparisonLayout.railRadius,
    width: MonthlyComparisonLayout.railWidth,
  },
  incomeRail: {
    backgroundColor: AppColors.income,
  },
  expenseRail: {
    backgroundColor: AppColors.expense,
  },
  comparisonBody: {
    flex: 1,
    gap: MonthlyComparisonLayout.bodyGap,
    minWidth: 0,
  },
  comparisonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: MonthlyComparisonLayout.headerGap,
    justifyContent: "space-between",
  },
  metricLabel: {
    fontSize: MonthlyComparisonLayout.labelFontSize,
    fontWeight: "900",
    lineHeight: MonthlyComparisonLayout.labelLineHeight,
  },
  previousAmount: {
    color: AppColors.mutedStrongText,
    flexShrink: 1,
    fontSize: MonthlyComparisonLayout.previousFontSize,
    fontWeight: "700",
    lineHeight: MonthlyComparisonLayout.previousLineHeight,
  },
  currentAmount: {
    fontSize: MonthlyComparisonLayout.amountFontSize,
    fontWeight: "900",
    lineHeight: MonthlyComparisonLayout.amountLineHeight,
  },
  comparisonSentence: {
    color: AppColors.text,
    fontSize: MonthlyComparisonLayout.sentenceFontSize,
    fontWeight: "700",
    lineHeight: MonthlyComparisonLayout.sentenceLineHeight,
  },
  divider: {
    height: MonthlyComparisonLayout.dividerHeight,
    backgroundColor: AppColors.border,
  },
  incomeText: {
    color: AppColors.income,
  },
  expenseText: {
    color: AppColors.expense,
  },
  mutedText: {
    color: AppColors.mutedText,
  },
});
