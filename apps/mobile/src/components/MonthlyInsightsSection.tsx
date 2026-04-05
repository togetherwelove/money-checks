import { StyleSheet, View } from "react-native";

import { AppLayout } from "../constants/layout";
import type { MonthlyInsights } from "../types/ledger";
import { MonthlyCategoryExpenseChart } from "./monthlyInsights/MonthlyCategoryExpenseChart";
import { MonthlyComparisonSection } from "./monthlyInsights/MonthlyComparisonSection";

type MonthlyInsightsSectionProps = {
  insights: MonthlyInsights;
};

export function MonthlyInsightsSection({ insights }: MonthlyInsightsSectionProps) {
  return (
    <View style={styles.section}>
      <MonthlyComparisonSection insights={insights} />
      <MonthlyCategoryExpenseChart categoryExpenses={insights.categoryExpenses} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: AppLayout.cardGap,
  },
});
