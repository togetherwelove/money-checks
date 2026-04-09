import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

import { AppColors } from "../../constants/colors";
import { AppLayout } from "../../constants/layout";
import { MONTHLY_INSIGHT_CHART_COLORS, MonthlyInsightCopy } from "../../constants/monthlyInsights";
import type { MonthlyCategoryExpense } from "../../types/ledger";
import { formatCurrency } from "../../utils/calendar";

type MonthlyCategoryExpenseChartProps = {
  categoryExpenses: MonthlyCategoryExpense[];
};

const CHART_SIZE = 152;
const STROKE_WIDTH = 24;
const CHART_RADIUS = (CHART_SIZE - STROKE_WIDTH) / 2;
const CHART_CIRCUMFERENCE = 2 * Math.PI * CHART_RADIUS;

export function MonthlyCategoryExpenseChart({
  categoryExpenses,
}: MonthlyCategoryExpenseChartProps) {
  const totalExpense = categoryExpenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{MonthlyInsightCopy.categoryTitle}</Text>
      <View style={styles.card}>
        {categoryExpenses.length ? (
          <>
            <View style={styles.chartShell}>
              <Svg height={CHART_SIZE} width={CHART_SIZE}>
                <G rotation="-90" origin={`${CHART_SIZE / 2}, ${CHART_SIZE / 2}`}>
                  <Circle
                    cx={CHART_SIZE / 2}
                    cy={CHART_SIZE / 2}
                    fill="transparent"
                    r={CHART_RADIUS}
                    stroke={AppColors.surfaceMuted}
                    strokeWidth={STROKE_WIDTH}
                  />
                  {categoryExpenses.map((item, index) => (
                    <Circle
                      key={`${item.category}-${item.amount}`}
                      cx={CHART_SIZE / 2}
                      cy={CHART_SIZE / 2}
                      fill="transparent"
                      r={CHART_RADIUS}
                      stroke={
                        MONTHLY_INSIGHT_CHART_COLORS[index % MONTHLY_INSIGHT_CHART_COLORS.length]
                      }
                      strokeDasharray={`${CHART_CIRCUMFERENCE * item.share} ${CHART_CIRCUMFERENCE}`}
                      strokeDashoffset={resolveDashOffset(categoryExpenses, index)}
                      strokeWidth={STROKE_WIDTH}
                    />
                  ))}
                </G>
              </Svg>
              <View pointerEvents="none" style={styles.chartCenter}>
                <Text style={styles.centerLabel}>{MonthlyInsightCopy.chartCenterLabel}</Text>
                <Text style={styles.centerValue}>{formatCurrency(totalExpense)}</Text>
              </View>
            </View>
            <View style={styles.legend}>
              {categoryExpenses.map((item, index) => (
                <View key={`${item.category}-${item.amount}-legend`} style={styles.legendRow}>
                  <View
                    style={[
                      styles.legendDot,
                      {
                        backgroundColor:
                          MONTHLY_INSIGHT_CHART_COLORS[index % MONTHLY_INSIGHT_CHART_COLORS.length],
                      },
                    ]}
                  />
                  <Text numberOfLines={1} style={styles.legendCategory}>
                    {item.category}
                  </Text>
                  <Text style={styles.legendAmount}>{formatCurrency(item.amount)}</Text>
                  <Text style={styles.legendShare}>
                    {Math.round(item.share * 100)}
                    {MonthlyInsightCopy.shareUnit}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.emptyText}>{MonthlyInsightCopy.categoryEmpty}</Text>
        )}
      </View>
    </View>
  );
}

function resolveDashOffset(categoryExpenses: MonthlyCategoryExpense[], index: number): number {
  const previousShare = categoryExpenses.slice(0, index).reduce((sum, item) => sum + item.share, 0);

  return -CHART_CIRCUMFERENCE * previousShare;
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  card: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 18,
    backgroundColor: AppColors.surface,
    padding: 14,
    gap: 14,
  },
  chartShell: {
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  chartCenter: {
    position: "absolute",
    alignItems: "center",
    gap: 2,
  },
  centerLabel: {
    color: AppColors.mutedText,
    fontSize: 11,
    fontWeight: "600",
  },
  centerValue: {
    color: AppColors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  legend: {
    gap: 8,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  legendCategory: {
    flex: 1,
    minWidth: 0,
    color: AppColors.text,
    fontSize: 12,
    fontWeight: "600",
  },
  legendAmount: {
    color: AppColors.mutedText,
    fontSize: 12,
    fontWeight: "600",
  },
  legendShare: {
    minWidth: 34,
    textAlign: "right",
    color: AppColors.mutedStrongText,
    fontSize: 12,
    fontWeight: "700",
  },
  emptyText: {
    color: AppColors.mutedText,
    fontSize: 12,
    lineHeight: 18,
  },
});
