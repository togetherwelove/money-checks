import { StyleSheet, Text, View } from "react-native";
import { getCashflowTotalStyles } from "../../constants/cashflowTotalStyles";
import { getAppColors } from "../../constants/colors";
import { AppLayout } from "../../constants/layout";
import {
  MonthlyComparisonLayout as Ui,
  MonthlyInsightChartCopy as Copy,
} from "../../constants/monthlyInsightCharts";
import { OneLineTextFitProps } from "../../constants/textLayout";
import { AppFontSize, AppLineHeight } from "../../constants/typography";
import { useAppTheme } from "../../hooks/useAppTheme";
import { createThemeValue } from "../../lib/appTheme";
import type { MonthlyComparisonMetric } from "../../types/ledger";
import type { DailyExpenseComparison } from "../../types/expenseComparison";
import { formatCurrency, toIsoDate } from "../../utils/calendar";
import { getExpenseComparisonThroughDate } from "../../utils/expenseComparisonChart";
import { ExpenseComparisonMountain } from "./ExpenseComparisonMountain";
import { ExpenseComparisonLegend } from "./ExpenseComparisonLegend";

export function MonthlyCashflowSummary({
  expense,
  previousPeriod,
  dailyExpenseComparison,
  isActive = true,
}: {
  expense: MonthlyComparisonMetric;
  previousPeriod?: string;
  dailyExpenseComparison?: DailyExpenseComparison;
  isActive?: boolean;
}) {
  useAppTheme();
  const styles = getStyles();
  const comparison = dailyExpenseComparison?.current.length
    ? getExpenseComparisonThroughDate(dailyExpenseComparison, toIsoDate(new Date()))
    : expense;
  const hasPreviousExpense = expense.previousAmount !== 0;
  const colors = getAppColors();
  const currentColor = comparison.direction === "decrease" ? colors.income : colors.expense;

  return (
    <View style={styles.section}>
      {previousPeriod ? (
        <View style={styles.comparison}>
          <View style={styles.comparisonCopy}>
            <Text style={styles.comparisonText}>
              {!hasPreviousExpense
                ? Copy.noPreviousExpense(previousPeriod)
                : comparison.direction === "same"
                  ? Copy.sameExpense(previousPeriod)
                  : `${Copy.expenseComparisonPrefix(previousPeriod)}\n`}
              {hasPreviousExpense && comparison.direction !== "same" ? (
                <>
                  <Text style={[styles.difference, { color: currentColor }]}>
                    {formatCurrency(comparison.deltaAmount)}
                  </Text>
                  {comparison.direction === "decrease" ? Copy.lowerExpense : Copy.higherExpense}
                </>
              ) : null}
            </Text>
            {dailyExpenseComparison ? (
              <ExpenseComparisonLegend
                currentColor={currentColor}
                previousPeriod={previousPeriod}
                comparison={dailyExpenseComparison}
              />
            ) : null}
          </View>
          {dailyExpenseComparison ? (
            <ExpenseComparisonMountain
              comparison={dailyExpenseComparison}
              isActive={isActive}
              currentColor={currentColor}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function MonthlyCashflowTotals({ expense, income }: { expense: number; income: number }) {
  useAppTheme();
  const styles = getCashflowTotalStyles();
  const colors = getAppColors();
  return (
    <View style={styles.totalsCard}>
      <View style={styles.totalRow}>
        <View style={styles.totalColumn}>
          <Text style={styles.totalLabel}>{Copy.expenseLabel}</Text>
          <Text {...OneLineTextFitProps} style={[styles.totalAmount, { color: colors.expense }]}>
            {formatCurrency(expense)}
          </Text>
        </View>
        <View style={styles.totalColumn}>
          <Text style={styles.totalLabel}>{Copy.incomeLabel}</Text>
          <Text {...OneLineTextFitProps} style={[styles.totalAmount, { color: colors.income }]}>
            {formatCurrency(income)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    section: { gap: AppLayout.cardGap },
    comparison: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: AppLayout.cardGap,
      padding: AppLayout.cardContentPadding,
      borderRadius: AppLayout.cardRadius,
      backgroundColor: getAppColors().surfaceMuted,
    },
    comparisonCopy: {
      flex: 1,
      minWidth: Ui.chartMinWidth,
      gap: AppLayout.cardGap,
    },
    comparisonText: {
      textAlign: "left",
      color: getAppColors().text,
      fontSize: AppFontSize.label,
      lineHeight: AppLineHeight.label,
    },
    difference: { fontWeight: "800" },
  }),
);
