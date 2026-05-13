import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { MonthlySummaryCopy } from "../constants/monthlySummary";
import { OneLineTextFitProps } from "../constants/textLayout";
import { formatCurrency } from "../utils/calendar";

type MonthlySummaryProps = {
  balanceAmount: number;
  totalExpense: string;
  totalIncome: string;
  variant?: "default" | "embedded";
};

type SummaryTone = "balance" | "income" | "expense";

const SUMMARY_HORIZONTAL_PADDING = 8;
const SUMMARY_VERTICAL_PADDING = 6;
const SUMMARY_ITEM_GAP = 1;
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
  totalExpense,
  totalIncome,
  variant = "default",
}: MonthlySummaryProps) {
  return (
    <View style={[styles.container, variant === "embedded" ? styles.embeddedContainer : null]}>
      <SummaryMetric title={MonthlySummaryCopy.incomeLabel} tone="income" value={totalIncome} />
      <FormulaOperator value={MonthlySummaryCopy.formulaMinus} />
      <SummaryMetric title={MonthlySummaryCopy.expenseLabel} tone="expense" value={totalExpense} />
      <FormulaOperator value={MonthlySummaryCopy.formulaEquals} />
      <SummaryMetric
        isResult
        title={MonthlySummaryCopy.balanceLabel}
        tone="balance"
        value={formatSignedCurrency(balanceAmount)}
        valueColor={resolveBalanceValueColor(balanceAmount)}
      />
    </View>
  );
}

function SummaryMetric({
  isResult = false,
  title,
  tone,
  value,
  valueColor,
}: {
  isResult?: boolean;
  title: string;
  tone: SummaryTone;
  value: string;
  valueColor?: string;
}) {
  const toneStyle = summaryToneStyles[tone];

  return (
    <View style={[styles.metric, isResult ? styles.resultMetric : null]}>
      <Text {...OneLineTextFitProps} style={styles.metricTitle}>
        {title}
      </Text>
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
    return `${MonthlySummaryCopy.positiveSign}${formatCurrency(amount)}`;
  }

  if (amount < 0) {
    return `${MonthlySummaryCopy.negativeSign}${formatCurrency(Math.abs(amount))}`;
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
    flexDirection: "row",
    alignItems: "stretch",
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
    paddingVertical: SUMMARY_VERTICAL_PADDING,
    gap: SUMMARY_ITEM_GAP,
  },
  metricTitle: {
    color: AppColors.mutedText,
    fontSize: 11,
    fontWeight: "600",
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
});
