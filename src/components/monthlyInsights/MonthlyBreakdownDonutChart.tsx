import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

import { AppChartColors, AppColors } from "../../constants/colors";
import { MonthlyInsightChartLayout } from "../../constants/monthlyInsightCharts";
import { formatCurrency } from "../../utils/calendar";

type MonthlyBreakdownItem = {
  amount: number;
  label: string;
  share: number;
};

type MonthlyBreakdownDonutChartProps = {
  centerLabel: string;
  emptyMessage: string;
  items: MonthlyBreakdownItem[];
  title: string;
};

const CHART_RADIUS =
  (MonthlyInsightChartLayout.donutSize - MonthlyInsightChartLayout.donutStrokeWidth) / 2;
const CHART_CIRCUMFERENCE = 2 * Math.PI * CHART_RADIUS;

export function MonthlyBreakdownDonutChart({
  centerLabel,
  emptyMessage,
  items,
  title,
}: MonthlyBreakdownDonutChartProps) {
  const totalExpense = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>
        {items.length ? (
          <>
            <View style={styles.chartShell}>
              <Svg
                height={MonthlyInsightChartLayout.donutSize}
                width={MonthlyInsightChartLayout.donutSize}
              >
                <G
                  origin={`${MonthlyInsightChartLayout.donutSize / 2}, ${
                    MonthlyInsightChartLayout.donutSize / 2
                  }`}
                  rotation="-90"
                >
                  <Circle
                    cx={MonthlyInsightChartLayout.donutSize / 2}
                    cy={MonthlyInsightChartLayout.donutSize / 2}
                    fill="transparent"
                    r={CHART_RADIUS}
                    stroke={AppColors.surfaceMuted}
                    strokeWidth={MonthlyInsightChartLayout.donutStrokeWidth}
                  />
                  {items.map((item, index) => (
                    <Circle
                      key={`${item.label}-${item.amount}`}
                      cx={MonthlyInsightChartLayout.donutSize / 2}
                      cy={MonthlyInsightChartLayout.donutSize / 2}
                      fill="transparent"
                      r={CHART_RADIUS}
                      stroke={AppChartColors[index % AppChartColors.length]}
                      strokeDasharray={`${CHART_CIRCUMFERENCE * item.share} ${CHART_CIRCUMFERENCE}`}
                      strokeDashoffset={resolveDashOffset(items, index)}
                      strokeWidth={MonthlyInsightChartLayout.donutStrokeWidth}
                    />
                  ))}
                </G>
              </Svg>
              <View pointerEvents="none" style={styles.chartCenter}>
                <Text style={styles.centerLabel}>{centerLabel}</Text>
                <Text style={styles.centerValue}>{formatCurrency(totalExpense)}</Text>
              </View>
            </View>
            <View style={styles.legend}>
              {items.map((item, index) => (
                <View key={`${item.label}-${item.amount}-legend`} style={styles.legendRow}>
                  <View
                    style={[
                      styles.legendDot,
                      {
                        backgroundColor: AppChartColors[index % AppChartColors.length],
                      },
                    ]}
                  />
                  <Text numberOfLines={1} style={styles.legendLabel}>
                    {item.label}
                  </Text>
                  <Text style={styles.legendAmount}>
                    {formatCurrency(item.amount)} ({Math.round(item.share * 100)}%)
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        )}
      </View>
    </View>
  );
}

function resolveDashOffset(items: MonthlyBreakdownItem[], index: number): number {
  const previousShare = items.slice(0, index).reduce((sum, item) => sum + item.share, 0);

  return -CHART_CIRCUMFERENCE * previousShare;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 16,
    backgroundColor: AppColors.surface,
    padding: 14,
    gap: 14,
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
  chartCenter: {
    position: "absolute",
    alignItems: "center",
    gap: 2,
  },
  chartShell: {
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: AppColors.mutedText,
    fontSize: 12,
    lineHeight: 18,
  },
  legend: {
    gap: 8,
  },
  legendAmount: {
    color: AppColors.mutedText,
    fontSize: 12,
    fontWeight: "600",
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  legendLabel: {
    flex: 1,
    minWidth: 0,
    color: AppColors.text,
    fontSize: 12,
    fontWeight: "600",
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
