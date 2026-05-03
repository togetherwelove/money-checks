import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../../constants/colors";
import {
  MonthlyInsightChartCopy,
  MonthlyInsightChartLayout,
} from "../../constants/monthlyInsightCharts";
import type { MonthlyTrendPoint } from "../../types/ledger";

type MonthlyTrendBarChartProps = {
  trendMonths: MonthlyTrendPoint[];
};

export function MonthlyTrendBarChart({ trendMonths }: MonthlyTrendBarChartProps) {
  const maxAmount = Math.max(
    ...trendMonths.flatMap((point) => [point.incomeAmount, point.expenseAmount]),
    0,
  );
  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>{MonthlyInsightChartCopy.trendTitle}</Text>
        <View style={styles.legend}>
          <LegendItem color={AppColors.income} label={MonthlyInsightChartCopy.incomeLabel} />
          <LegendItem color={AppColors.expense} label={MonthlyInsightChartCopy.expenseLabel} />
        </View>
      </View>
      <View style={styles.card}>
        <View style={styles.chartRow}>
          {trendMonths.map((point) => (
            <View key={point.key} style={styles.monthColumn}>
              <View style={styles.barArea}>
                <TrendBar
                  amount={point.incomeAmount}
                  color={AppColors.income}
                  maxAmount={maxAmount}
                />
                <TrendBar
                  amount={point.expenseAmount}
                  color={AppColors.expense}
                  maxAmount={maxAmount}
                />
              </View>
              <Text style={[styles.monthLabel, point.isCurrentMonth ? styles.activeMonth : null]}>
                {point.monthLabel}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function TrendBar({
  amount,
  color,
  maxAmount,
}: {
  amount: number;
  color: string;
  maxAmount: number;
}) {
  const height =
    amount > 0 && maxAmount > 0
      ? Math.max(
          MonthlyInsightChartLayout.minVisibleBarHeight,
          (amount / maxAmount) * MonthlyInsightChartLayout.trendBarHeight,
        )
      : 0;

  return <View style={[styles.bar, { backgroundColor: color, height }]} />;
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  activeMonth: {
    color: AppColors.text,
    fontWeight: "800",
  },
  bar: {
    width: 10,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  barArea: {
    height: MonthlyInsightChartLayout.trendBarHeight,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 3,
  },
  card: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 16,
    backgroundColor: AppColors.surface,
    padding: 14,
    gap: 12,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendText: {
    color: AppColors.mutedText,
    fontSize: 11,
    fontWeight: "600",
  },
  monthColumn: {
    flex: 1,
    gap: 6,
  },
  monthLabel: {
    color: AppColors.mutedText,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: "700",
  },
});
