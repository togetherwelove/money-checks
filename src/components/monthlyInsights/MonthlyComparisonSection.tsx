import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { AppLayout } from "../../constants/layout";
import { MonthlyInsightCopy } from "../../constants/monthlyInsights";
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
      <Text style={styles.sectionTitle}>{MonthlyInsightCopy.comparisonTitle}</Text>
      <View style={styles.row}>
        <ComparisonCard
          comparison={insights.incomeComparison}
          previousMonthLabel={insights.previousMonthLabel}
          title={MonthlyInsightCopy.incomeTitle}
          variant="income"
        />
        <ComparisonCard
          comparison={insights.expenseComparison}
          previousMonthLabel={insights.previousMonthLabel}
          title={MonthlyInsightCopy.expenseTitle}
          variant="expense"
        />
      </View>
    </View>
  );
}

function ComparisonCard({ comparison, previousMonthLabel, title, variant }: ComparisonCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const summary = buildMonthlyComparisonSummary(comparison, previousMonthLabel, variant);

  return (
    <Pressable onPress={() => setIsExpanded((current) => !current)} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Feather
          color={AppColors.mutedText}
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={14}
        />
      </View>
      <Text style={[styles.currentAmount, resolveToneStyle(summary.tone)]}>
        {summary.currentAmountLabel}
      </Text>
      <Text style={[styles.deltaLabel, resolveToneStyle(summary.tone)]}>
        {summary.summaryMessage}
      </Text>
      {isExpanded ? (
        <View style={styles.expandedContent}>
          <Text style={styles.previousAmount}>{summary.previousAmountLabel}</Text>
          {summary.changeRateLabel ? (
            <Text style={styles.changeRateLabel}>{summary.changeRateLabel}</Text>
          ) : null}
        </View>
      ) : null}
    </Pressable>
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
  row: {
    flexDirection: "row",
    gap: AppLayout.cardGap,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 16,
    backgroundColor: AppColors.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  expandedContent: {
    gap: 4,
  },
  cardTitle: {
    color: AppColors.mutedText,
    fontSize: 11,
    fontWeight: "600",
  },
  currentAmount: {
    fontSize: 20,
    fontWeight: "800",
  },
  previousAmount: {
    color: AppColors.mutedStrongText,
    fontSize: 11,
    fontWeight: "500",
  },
  deltaLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  changeRateLabel: {
    color: AppColors.mutedText,
    fontSize: 11,
    fontWeight: "600",
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
