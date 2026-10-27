import { type StyleProp, StyleSheet, Text, type TextStyle, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { CardTitleTextStyle, CompactLabelTextStyle } from "../../constants/uiStyles";
import {
  MonthlyInsightChartCopy,
  MonthlyInsightChartLayout,
} from "../../constants/monthlyInsightCharts";
import { CompactTextProps, OneLineTextFitProps } from "../../constants/textLayout";
import { useExpenseTextColor } from "../../contexts/ExpenseTextColorContext";
import type { MonthlyTrendPoint } from "../../types/ledger";
import { formatChartAxisCurrency } from "../../utils/currency";
import { buildChartAxis } from "../../utils/chartAxis";

type MonthlyTrendBarChartProps = {
  title?: string;
  trendMonths: MonthlyTrendPoint[];
};

export function MonthlyTrendBarChart({
  title = MonthlyInsightChartCopy.trendTitle,
  trendMonths,
}: MonthlyTrendBarChartProps) {
  const expenseTextStyle = useExpenseTextColor().textStyle;
  const dataMaximum = Math.max(
    ...trendMonths.flatMap((point) => [point.incomeAmount, point.expenseAmount]),
    0,
  );
  const { maximum: maxAmount, ticks: yAxisTicks } = buildChartAxis(dataMaximum, MonthlyInsightChartLayout.trendYAxisLabelCount);

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text {...CompactTextProps} accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>
        <View style={styles.legend}>
          <LegendItem color={AppColors.income} label={MonthlyInsightChartCopy.incomeLabel} />
          <LegendItem
            color={AppColors.expense}
            label={MonthlyInsightChartCopy.expenseLabel}
            textStyle={expenseTextStyle}
          />
        </View>
      </View>
      <View style={styles.chartFrame}>
        <View style={styles.plotRow}>
          <View style={styles.yAxis}>
            <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.axisMeasurement}>
              {yAxisTicks.map((tick) => <Text key={tick.key} {...OneLineTextFitProps} style={styles.axisText}>{formatChartAxisCurrency(tick.amount)}</Text>)}
            </View>
            {yAxisTicks.map((tick) => (
              <Text key={tick.key} {...OneLineTextFitProps} style={[styles.axisText, styles.yAxisLabel, { bottom: maxAmount > 0 ? (tick.amount / maxAmount) * MonthlyInsightChartLayout.trendBarHeight : 0 }]}>
                {formatChartAxisCurrency(tick.amount)}
              </Text>
            ))}
          </View>
          <View style={styles.chartContent}>
            <View style={styles.chartBody}>
              <View pointerEvents="none" style={styles.gridLayer}>
                {yAxisTicks.map((tick) => (
                  <View key={tick.key} style={[styles.gridLine, { bottom: maxAmount > 0 ? (tick.amount / maxAmount) * MonthlyInsightChartLayout.trendBarHeight : 0 }]} />
                ))}
              </View>
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
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.monthLabelRow}>
              {trendMonths.map((point) => (
                <Text
                  key={point.key}
                  {...OneLineTextFitProps}
                  style={[styles.monthLabel, point.isCurrentMonth ? styles.activeMonth : null]}
                >
                  {point.monthLabel}
                </Text>
              ))}
            </View>
          </View>
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

function LegendItem({
  color,
  label,
  textStyle,
}: {
  color: string;
  label: string;
  textStyle?: StyleProp<TextStyle>;
}) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text {...CompactTextProps} style={[styles.legendText, textStyle]}>{label}</Text>
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
    height: "100%",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 3,
  },
  chartFrame: {
    gap: 12,
  },
  chartBody: {
    height: MonthlyInsightChartLayout.trendBarHeight,
    justifyContent: "flex-end",
  },
  chartContent: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  chartRow: {
    height: "100%",
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  gridLayer: {
    ...StyleSheet.absoluteFill,
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: MonthlyInsightChartLayout.trendGridLineWidth,
    backgroundColor: AppColors.border,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
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
    ...CompactLabelTextStyle,
  },
  monthColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    minWidth: 0,
  },
  monthLabel: {
    ...CompactLabelTextStyle,
    flex: 1,
    minWidth: 0,
    textAlign: "center",
  },
  monthLabelRow: {
    flexDirection: "row",
    gap: 6,
  },
  plotRow: {
    flexDirection: "row",
    gap: MonthlyInsightChartLayout.trendYAxisGap,
    paddingTop: MonthlyInsightChartLayout.trendYAxisLabelLineHeight / 2,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    ...CardTitleTextStyle,
  },
  yAxis: {
    alignItems: "flex-end",
    height: MonthlyInsightChartLayout.trendBarHeight,
  },
  yAxisLabel: {
    position: "absolute",
    left: 0,
    right: 0,
    transform: [{ translateY: MonthlyInsightChartLayout.trendYAxisLabelLineHeight / 2 }],
    height: MonthlyInsightChartLayout.trendYAxisLabelLineHeight,
    lineHeight: MonthlyInsightChartLayout.trendYAxisLabelLineHeight,
    color: AppColors.mutedText,
    textAlign: "right",
  },
  axisMeasurement: { opacity: 0 },
  axisText: { fontSize: MonthlyInsightChartLayout.trendYAxisLabelFontSize, fontWeight: "600", lineHeight: MonthlyInsightChartLayout.trendYAxisLabelLineHeight },
});
