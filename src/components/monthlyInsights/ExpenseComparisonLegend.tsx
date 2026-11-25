import { StyleSheet, Text, View } from "react-native";
import { getAppColors } from "../../constants/colors";
import { AppLayout } from "../../constants/layout";
import { formatMonthLabel } from "../../constants/ledgerDisplay";
import type { DailyExpenseComparison } from "../../types/expenseComparison";
import { parseIsoDate } from "../../utils/calendar";
import {
  MonthlyComparisonLayout as Ui,
  MonthlyInsightChartCopy as Copy,
  getExpenseComparisonColors,
} from "../../constants/monthlyInsightCharts";
import { AppFontSize } from "../../constants/typography";
import { useAppTheme } from "../../hooks/useAppTheme";
import { createThemeValue } from "../../lib/appTheme";

export function ExpenseComparisonLegend({
  previousPeriod,
  comparison,
  currentColor = getExpenseComparisonColors().current,
}: {
  previousPeriod: string;
  comparison?: DailyExpenseComparison;
  currentColor?: string;
}) {
  useAppTheme();
  const styles = getStyles();
  const isMonthly = previousPeriod === Copy.previousMonth;
  const previousDate = comparison?.previous[0]?.date;
  const currentDate = comparison?.current[0]?.date;
  const previousLabel =
    isMonthly && previousDate ? formatMonthLabel(parseIsoDate(previousDate)) : previousPeriod;
  const currentLabel =
    isMonthly && currentDate
      ? formatMonthLabel(parseIsoDate(currentDate))
      : isMonthly
        ? Copy.currentMonth
        : Copy.currentPeriod;
  return (
    <View style={styles.legend}>
      <View style={styles.item}>
        <View style={[styles.dot, styles.previous]} />
        <Text style={styles.label}>{previousLabel}</Text>
      </View>
      <View style={styles.item}>
        <View style={[styles.dot, { backgroundColor: currentColor }]} />
        <Text style={styles.label}>{currentLabel}</Text>
      </View>
    </View>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    legend: { flexDirection: "row", flexWrap: "wrap", gap: AppLayout.cardGap },
    item: { flexDirection: "row", alignItems: "center", gap: AppLayout.compactGap },
    dot: { width: Ui.legendDotSize, height: Ui.legendDotSize, borderRadius: Ui.railRadius },
    previous: { backgroundColor: getExpenseComparisonColors().previous },
    label: { color: getAppColors().mutedText, fontSize: AppFontSize.body },
  }),
);
