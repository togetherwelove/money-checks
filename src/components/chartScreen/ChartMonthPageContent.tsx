import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { AppLayout } from "../../constants/layout";
import type { ChartMonthData } from "../../hooks/ledgerScreenState/types";
import { formatCurrency } from "../../utils/calendar";
import { MonthlyInsightsSection } from "../MonthlyInsightsSection";
import { MonthlySummary } from "../MonthlySummary";

type ChartMonthPageContentProps = {
  month: ChartMonthData;
};

export function ChartMonthPageContent({ month }: ChartMonthPageContentProps) {
  return (
    <View style={styles.content}>
      <Text style={styles.title}>{month.title}</Text>
      <MonthlySummary
        totalExpense={formatCurrency(month.monthlyLedger.totalExpense)}
        totalIncome={formatCurrency(month.monthlyLedger.totalIncome)}
      />
      <MonthlyInsightsSection insights={month.monthlyInsights} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: AppLayout.screenPadding,
    gap: AppLayout.cardGap,
    paddingBottom: 24,
  },
  title: {
    color: AppColors.text,
    fontSize: 22,
    fontWeight: "800",
  },
});
