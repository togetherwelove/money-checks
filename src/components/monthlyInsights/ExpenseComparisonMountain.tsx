import { useMemo } from "react";
import { useIsFocused } from "@react-navigation/native";
import { StyleSheet, View } from "react-native";
import { MonthlyComparisonLayout as Ui } from "../../constants/monthlyInsightCharts";
import { useAppTheme } from "../../hooks/useAppTheme";
import type { DailyExpenseComparison } from "../../types/expenseComparison";
import { toIsoDate } from "../../utils/calendar";
import { buildExpenseComparisonChart } from "../../utils/expenseComparisonChart";
import { ExpenseComparisonGraphic } from "./ExpenseComparisonGraphic";

export function ExpenseComparisonMountain({
  comparison,
  isActive = true,
  currentColor,
}: {
  comparison: DailyExpenseComparison;
  isActive?: boolean;
  currentColor?: string;
}) {
  useAppTheme();
  const isFocused = useIsFocused();
  const today = toIsoDate(new Date());
  const chart = useMemo(() => buildExpenseComparisonChart(comparison, today), [comparison, today]);

  return (
    <View style={styles.chart}>
      <ExpenseComparisonGraphic
        chart={chart}
        isActive={isActive && isFocused}
        currentColor={currentColor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { flex: 1, minWidth: Ui.chartMinWidth },
});
