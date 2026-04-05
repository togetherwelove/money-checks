import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { AppLayout } from "../../constants/layout";
import { MonthlyInsightCopy } from "../../constants/monthlyInsights";
import type {
  MonthlyChangeDirection,
  MonthlyComparisonMetric,
  MonthlyInsights,
} from "../../types/ledger";
import { formatCurrency } from "../../utils/calendar";

type MonthlyComparisonSectionProps = {
  insights: MonthlyInsights;
};

export function MonthlyComparisonSection({ insights }: MonthlyComparisonSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{MonthlyInsightCopy.comparisonTitle}</Text>
      <View style={styles.row}>
        <ComparisonCard
          currentAmount={insights.incomeComparison.currentAmount}
          deltaAmount={insights.incomeComparison.deltaAmount}
          direction={insights.incomeComparison.direction}
          previousAmount={insights.incomeComparison.previousAmount}
          previousMonthLabel={insights.previousMonthLabel}
          title={MonthlyInsightCopy.incomeTitle}
          variant="income"
        />
        <ComparisonCard
          currentAmount={insights.expenseComparison.currentAmount}
          deltaAmount={insights.expenseComparison.deltaAmount}
          direction={insights.expenseComparison.direction}
          previousAmount={insights.expenseComparison.previousAmount}
          previousMonthLabel={insights.previousMonthLabel}
          title={MonthlyInsightCopy.expenseTitle}
          variant="expense"
        />
      </View>
    </View>
  );
}

type ComparisonCardProps = {
  currentAmount: number;
  deltaAmount: number;
  direction: MonthlyChangeDirection;
  previousAmount: number;
  previousMonthLabel: string;
  title: string;
  variant: "expense" | "income";
};

function ComparisonCard({
  currentAmount,
  deltaAmount,
  direction,
  previousAmount,
  previousMonthLabel,
  title,
  variant,
}: ComparisonCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text
        style={[
          styles.currentAmount,
          variant === "income" ? styles.incomeText : styles.expenseText,
        ]}
      >
        {formatCurrency(currentAmount)}
      </Text>
      <Text style={styles.previousAmount}>
        {MonthlyInsightCopy.previousMonthPrefix} {previousMonthLabel}{" "}
        {formatCurrency(previousAmount)}
      </Text>
      <Text style={[styles.deltaLabel, resolveDeltaTone(direction, variant)]}>
        {formatDeltaLabel(deltaAmount, direction, variant)}
      </Text>
    </View>
  );
}

function formatDeltaLabel(
  deltaAmount: number,
  direction: MonthlyChangeDirection,
  variant: "expense" | "income",
): string {
  if (direction === "same") {
    return MonthlyInsightCopy.comparisonSame;
  }

  const amountLabel = formatCurrency(deltaAmount);
  if (variant === "expense") {
    return direction === "increase"
      ? `전월보다 ${amountLabel} 더 썼어요`
      : `전월보다 ${amountLabel} 덜 썼어요`;
  }

  return direction === "increase"
    ? `전월보다 ${amountLabel} 더 벌었어요`
    : `전월보다 ${amountLabel} 덜 벌었어요`;
}

function resolveDeltaTone(direction: MonthlyChangeDirection, variant: "expense" | "income") {
  if (direction === "same") {
    return styles.mutedText;
  }

  if (variant === "expense") {
    return direction === "increase" ? styles.expenseText : styles.incomeText;
  }

  return direction === "increase" ? styles.incomeText : styles.expenseText;
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
  cardTitle: {
    color: AppColors.mutedText,
    fontSize: 11,
    fontWeight: "600",
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
    fontSize: 12,
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
