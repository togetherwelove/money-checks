import { useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { CalendarSummaryLabels } from "../constants/calendarSummary";
import { AppColors } from "../constants/colors";
import { MonthlySummaryUi as Ui } from "../constants/home";
import { useExpenseTextColor } from "../contexts/ExpenseTextColorContext";
import { formatCurrency } from "../utils/calendar";

type MonthlySummaryProps = {
  balanceAmount: number;
  balanceLabel?: string;
  summaryLabel: string;
  totalExpense: string;
  totalIncome: string;
};

export function MonthlySummary({ balanceAmount, balanceLabel, summaryLabel, totalExpense, totalIncome }: MonthlySummaryProps) {
  const expenseTextColor = useExpenseTextColor().textColor;
  const { fontScale } = useWindowDimensions();
  const [contentWidth, setContentWidth] = useState(0);
  const balanceValue = balanceLabel ?? `${balanceAmount > 0 ? "+" : balanceAmount < 0 ? "-" : ""}${formatCurrency(Math.abs(balanceAmount))}`;
  const stacked = (contentWidth > 0 && contentWidth < Ui.minimumRowWidth * fontScale) ||
    Math.max(totalExpense.length, totalIncome.length, balanceValue.length) > Ui.maximumInlineAmountLength;

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.summaryLabel}>{summaryLabel}</Text>
      <View onLayout={(event) => setContentWidth(event.nativeEvent.layout.width)} style={[styles.metrics, stacked && styles.stackedMetrics]}>
        <SummaryMetric label={CalendarSummaryLabels.expense} value={totalExpense} color={expenseTextColor} stacked={stacked} emphasized />
        <SummaryMetric label={CalendarSummaryLabels.income} value={totalIncome} color={AppColors.income} stacked={stacked} />
        <SummaryMetric label={CalendarSummaryLabels.balance} value={balanceValue} color={!balanceLabel && balanceAmount > 0 ? AppColors.income : AppColors.text} stacked={stacked} />
      </View>
    </View>
  );
}

function SummaryMetric({ label, value, color, stacked, emphasized = false }: {
  label: string; value: string; color: string; stacked: boolean; emphasized?: boolean;
}) {
  return (
    <View style={[styles.metric, stacked && styles.stackedMetric]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color }, emphasized && styles.emphasizedValue, stacked && styles.stackedValue]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Ui.contentGap, paddingVertical: Ui.verticalPadding },
  summaryLabel: { flexShrink: 1, color: AppColors.text, fontSize: Ui.titleFontSize, fontWeight: "700" },
  metrics: { flexDirection: "row", gap: Ui.contentGap },
  stackedMetrics: { flexDirection: "column" },
  metric: { flex: 1, minWidth: 0, gap: Ui.metricGap },
  stackedMetric: { flex: 0, flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  metricLabel: { flexShrink: 1, color: AppColors.mutedStrongText, fontSize: Ui.labelFontSize, fontWeight: "500" },
  metricValue: { fontSize: Ui.metricValueFontSize, fontWeight: "600", fontVariant: ["tabular-nums"] },
  emphasizedValue: { fontWeight: "800" },
  stackedValue: { flexShrink: 1, textAlign: "right" },
});
