import { ScrollView, StyleSheet } from "react-native";

import { MonthlyInsightsSection } from "../components/MonthlyInsightsSection";
import { MonthlySummary } from "../components/MonthlySummary";
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import type { LedgerScreenState } from "../hooks/useLedgerScreenState";
import { formatCurrency } from "../utils/calendar";

type ChartScreenProps = {
  state: LedgerScreenState;
};

export function ChartScreen({ state }: ChartScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <MonthlySummary
        totalExpense={formatCurrency(state.monthlyLedger.totalExpense)}
        totalIncome={formatCurrency(state.monthlyLedger.totalIncome)}
      />
      <MonthlyInsightsSection insights={state.monthlyInsights} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    padding: AppLayout.screenPadding,
    gap: AppLayout.cardGap,
    paddingBottom: 24,
  },
});
