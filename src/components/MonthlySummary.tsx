import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { OneLineTextFitProps } from "../constants/textLayout";
import { formatCurrency } from "../utils/calendar";

type MonthlySummaryProps = {
  balanceAmount: number;
  balanceLabel?: string;
  summaryLabel: string;
  totalExpense: string;
  totalIncome: string;
  variant?: "default" | "embedded";
};

type SummaryTone = "balance" | "income" | "expense";

const SUMMARY_HORIZONTAL_PADDING = 8;
const SUMMARY_VERTICAL_PADDING = 6;
const SUMMARY_OPERATOR_WIDTH = 16;
const SUMMARY_VALUE_MINIMUM_FONT_SCALE = 0.85;

const summaryToneStyles = {
  balance: {
    valueColor: AppColors.primary,
  },
  expense: {
    valueColor: AppColors.expense,
  },
  income: {
    valueColor: AppColors.income,
  },
} as const;

export function MonthlySummary({
  balanceAmount,
  balanceLabel,
  summaryLabel,
  totalExpense,
  totalIncome,
  variant = "default",
}: MonthlySummaryProps) {
  return (
    <View style={[styles.container, variant === "embedded" ? styles.embeddedContainer : null]}>
      <Text {...OneLineTextFitProps} style={styles.summaryLabel}>
        {summaryLabel}
      </Text>
      <View style={styles.metricRow}>
        <SummaryMetric tone="income" value={totalIncome} />
        <FormulaOperator value="-" />
        <SummaryMetric tone="expense" value={totalExpense} />
        <FormulaOperator value="=" />
        <SummaryMetric
          isResult
          tone="balance"
          value={balanceLabel ?? formatSignedCurrency(balanceAmount)}
          valueColor={resolveBalanceValueColor(balanceAmount)}
        />
      </View>
    </View>
  );
}

function SummaryMetric({
  isResult = false,
  tone,
  value,
  valueColor,
}: {
  isResult?: boolean;
  tone: SummaryTone;
  value: string;
  valueColor?: string;
}) {
  const toneStyle = summaryToneStyles[tone];

  return (
    <View style={[styles.metric, isResult ? styles.resultMetric : null]}>
      <Text
        adjustsFontSizeToFit
        minimumFontScale={SUMMARY_VALUE_MINIMUM_FONT_SCALE}
        numberOfLines={1}
        style={[
          styles.metricValue,
          isResult ? styles.resultValue : null,
          { color: valueColor ?? toneStyle.valueColor },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function FormulaOperator({ value }: { value: string }) {
  return (
    <View style={styles.operator}>
      <Text style={styles.operatorText}>{value}</Text>
    </View>
  );
}

function formatSignedCurrency(amount: number): string {
  if (amount > 0) {
    return `+ ${formatCurrency(amount)}`;
  }

  if (amount < 0) {
    return `- ${formatCurrency(Math.abs(amount))}`;
  }

  return formatCurrency(amount);
}

function resolveBalanceValueColor(amount: number): string {
  if (amount > 0) {
    return AppColors.income;
  }

  if (amount < 0) {
    return AppColors.expense;
  }

  return AppColors.primary;
}

const styles = StyleSheet.create({
  container: {
    borderTopColor: AppColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: AppColors.surfaceMuted,
  },
  embeddedContainer: {
    borderTopWidth: 0,
    borderBottomWidth: 0,
    backgroundColor: "transparent",
  },
  metric: {
    flex: 1,
    paddingHorizontal: SUMMARY_HORIZONTAL_PADDING,
    paddingBottom: SUMMARY_VERTICAL_PADDING,
  },
  metricRow: {
    alignItems: "baseline",
    flexDirection: "row",
  },
  metricValue: {
    fontSize: 13,
    fontWeight: "800",
  },
  operator: {
    width: SUMMARY_OPERATOR_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
  operatorText: {
    color: AppColors.mutedText,
    fontSize: 13,
    fontWeight: "800",
  },
  resultMetric: {
    flex: 1.15,
  },
  resultValue: {
    fontSize: 14,
  },
  summaryLabel: {
    color: AppColors.mutedStrongText,
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: SUMMARY_HORIZONTAL_PADDING,
    paddingTop: SUMMARY_VERTICAL_PADDING,
  },
});
