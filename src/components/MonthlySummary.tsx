import { StyleSheet, Text, View } from "react-native";

import { CalendarSummaryLabels } from "../constants/calendarSummary";
import { AppColors } from "../constants/colors";
import { MonthlySummaryUi } from "../constants/home";
import { AppLayout } from "../constants/layout";
import { OneLineTextFitProps } from "../constants/textLayout";
import { useExpenseTextColor } from "../contexts/ExpenseTextColorContext";
import { formatCurrency } from "../utils/calendar";

type MonthlySummaryProps = {
  balanceAmount: number;
  balanceLabel?: string;
  summaryLabel: string;
  totalExpense: string;
  totalIncome: string;
};

export function MonthlySummary({
  balanceAmount,
  balanceLabel,
  summaryLabel,
  totalExpense,
  totalIncome,
}: MonthlySummaryProps) {
  const expenseTextColor = useExpenseTextColor().textColor;
  const balanceValue = balanceLabel ?? formatSignedCurrency(balanceAmount);
  const balanceValueColor = resolveBalanceValueColor(balanceAmount, expenseTextColor);

  return (
    <View style={styles.container}>
      <View style={styles.headlineRow}>
        <Text {...OneLineTextFitProps} style={styles.summaryLabel}>
          {summaryLabel}
        </Text>
        <Text {...OneLineTextFitProps} style={[styles.balanceValue, { color: balanceValueColor }]}>
          {balanceValue}
        </Text>
      </View>
      <View style={styles.metricRow}>
        <SummaryMetric
          label={CalendarSummaryLabels.income}
          value={totalIncome}
          valueColor={AppColors.income}
        />
        <View style={styles.metricDivider} />
        <SummaryMetric
          label={CalendarSummaryLabels.expense}
          value={totalExpense}
          valueColor={expenseTextColor}
        />
      </View>
    </View>
  );
}

function SummaryMetric({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor: string;
}) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text
        {...OneLineTextFitProps}
        adjustsFontSizeToFit
        minimumFontScale={MonthlySummaryUi.minimumFontScale}
        style={[styles.metricValue, { color: valueColor }]}
      >
        {value}
      </Text>
    </View>
  );
}

function formatSignedCurrency(amount: number): string {
  if (amount > 0) {
    return `+${formatCurrency(amount)}`;
  }

  if (amount < 0) {
    return `-${formatCurrency(Math.abs(amount))}`;
  }

  return formatCurrency(amount);
}

function resolveBalanceValueColor(amount: number, expenseTextColor: string): string {
  if (amount > 0) {
    return AppColors.income;
  }

  if (amount < 0) {
    return expenseTextColor;
  }

  return AppColors.primary;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.surfaceMuted,
    borderColor: AppColors.border,
    borderRadius: AppLayout.cardRadius,
    borderWidth: StyleSheet.hairlineWidth,
    gap: MonthlySummaryUi.contentGap,
    paddingHorizontal: MonthlySummaryUi.horizontalPadding,
    paddingVertical: MonthlySummaryUi.verticalPadding,
  },
  headlineRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: MonthlySummaryUi.contentGap,
    justifyContent: "space-between",
  },
  balanceValue: {
    flexShrink: 1,
    fontSize: MonthlySummaryUi.balanceFontSize,
    fontWeight: "800",
    lineHeight: MonthlySummaryUi.balanceLineHeight,
  },
  metric: {
    alignItems: "baseline",
    flex: 1,
    flexDirection: "row",
    gap: MonthlySummaryUi.metricGap,
  },
  metricRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: MonthlySummaryUi.contentGap,
  },
  metricDivider: {
    backgroundColor: AppColors.border,
    height: 12,
    width: StyleSheet.hairlineWidth,
  },
  metricLabel: {
    color: AppColors.mutedStrongText,
    fontSize: MonthlySummaryUi.labelFontSize,
    fontWeight: "700",
  },
  metricValue: {
    flex: 1,
    fontSize: MonthlySummaryUi.metricValueFontSize,
    fontWeight: "800",
    textAlign: "right",
  },
  summaryLabel: {
    color: AppColors.text,
    flexShrink: 1,
    fontSize: MonthlySummaryUi.titleFontSize,
    fontWeight: "700",
  },
});
