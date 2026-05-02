import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { MonthlyInsightChartCopy } from "../../constants/monthlyInsightCharts";
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
  previousMonthLabel: string;
  title: string;
  variant: "expense" | "income";
};

export function MonthlyComparisonSection({ insights }: MonthlyComparisonSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{MonthlyInsightChartCopy.previousComparisonTitle}</Text>
      <View style={styles.card}>
        <ComparisonRow
          comparison={insights.incomeComparison}
          previousMonthLabel={insights.previousMonthLabel}
          title={MonthlyInsightChartCopy.incomeLabel}
          variant="income"
        />
        <View style={styles.divider} />
        <ComparisonRow
          comparison={insights.expenseComparison}
          previousMonthLabel={insights.previousMonthLabel}
          title={MonthlyInsightChartCopy.expenseLabel}
          variant="expense"
        />
      </View>
    </View>
  );
}

function ComparisonRow({ comparison, previousMonthLabel, title, variant }: ComparisonCardProps) {
  const summary = buildMonthlyComparisonSummary(comparison, previousMonthLabel, variant);

  return (
    <View style={styles.comparisonRow}>
      <View style={styles.labelColumn}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.previousAmount}>{summary.previousAmountLabel}</Text>
      </View>
      <View style={styles.amountColumn}>
        <Text style={[styles.currentAmount, resolveToneStyle(summary.tone)]}>
          {summary.currentAmountLabel}
        </Text>
        <Text style={[styles.deltaLabel, resolveToneStyle(summary.tone)]}>
          {summary.changeRateLabel ?? summary.summaryMessage}
        </Text>
      </View>
    </View>
  );
}

function resolveToneStyle(tone: MonthlyComparisonTone) {
  if (tone === "muted") {
    return styles.mutedText;
  }

  return tone === "income" ? styles.incomeText : styles.expenseText;
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
  card: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 16,
    backgroundColor: AppColors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  amountColumn: {
    alignItems: "flex-end",
    gap: 2,
  },
  comparisonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.border,
  },
  labelColumn: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  cardTitle: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  currentAmount: {
    fontSize: 16,
    fontWeight: "800",
  },
  previousAmount: {
    color: AppColors.mutedStrongText,
    fontSize: 11,
    fontWeight: "500",
  },
  deltaLabel: {
    fontSize: 11,
    fontWeight: "700",
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
