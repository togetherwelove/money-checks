import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

import { AppChartColors, AppColors } from "../../constants/colors";
import {
  MonthlyInsightChartCopy,
  MonthlyInsightChartLayout,
} from "../../constants/monthlyInsightCharts";
import { formatCurrency } from "../../utils/calendar";

type MonthlyBreakdownItem = {
  amount: number;
  key: string;
  label: string;
  share: number;
};

type MonthlyBreakdownLegendItem = MonthlyBreakdownItem & {
  isActive: boolean;
};

type MonthlyBreakdownDonutChartProps = {
  centerLabel: string;
  emptyMessage: string;
  items: MonthlyBreakdownItem[];
  legendItems?: MonthlyBreakdownLegendItem[];
  onToggleItem?: (itemKey: string) => void;
  title: string;
};

const CHART_RADIUS =
  (MonthlyInsightChartLayout.donutSize - MonthlyInsightChartLayout.donutStrokeWidth) / 2;
const CHART_CIRCUMFERENCE = 2 * Math.PI * CHART_RADIUS;

export function MonthlyBreakdownDonutChart({
  centerLabel,
  emptyMessage,
  items,
  legendItems,
  onToggleItem,
  title,
}: MonthlyBreakdownDonutChartProps) {
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const visibleLegendItems =
    legendItems ?? items.map((item) => ({ ...item, isActive: true }));
  const itemColorByKey = new Map(
    visibleLegendItems.map((item, index) => [
      item.key,
      AppChartColors[index % AppChartColors.length],
    ]),
  );

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.content}>
        {visibleLegendItems.length ? (
          <View style={styles.chartOverview}>
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
                      key={`${item.key}-${item.amount}`}
                      cx={MonthlyInsightChartLayout.donutSize / 2}
                      cy={MonthlyInsightChartLayout.donutSize / 2}
                      fill="transparent"
                      r={CHART_RADIUS}
                      stroke={
                        itemColorByKey.get(item.key) ??
                        AppChartColors[index % AppChartColors.length]
                      }
                      strokeDasharray={`${CHART_CIRCUMFERENCE * item.share} ${CHART_CIRCUMFERENCE}`}
                      strokeDashoffset={resolveDashOffset(items, index)}
                      strokeWidth={MonthlyInsightChartLayout.donutStrokeWidth}
                    />
                  ))}
                </G>
              </Svg>
              <View pointerEvents="none" style={styles.chartCenter}>
                <Text style={styles.centerLabel}>{centerLabel}</Text>
                <Text style={styles.centerValue}>{formatCurrency(totalAmount)}</Text>
              </View>
            </View>
            <ScrollView
              contentContainerStyle={styles.selectedSummary}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              style={styles.selectedSummaryList}
            >
              {visibleLegendItems.map((item) => (
                <Pressable
                  accessibilityLabel={`${item.label} ${
                    item.isActive
                      ? MonthlyInsightChartCopy.visibleItemAccessibilitySuffix
                      : MonthlyInsightChartCopy.hiddenItemAccessibilitySuffix
                  }`}
                  accessibilityRole="button"
                  accessibilityState={{ checked: item.isActive }}
                  key={`${item.key}-${item.amount}-summary`}
                  onPress={() => onToggleItem?.(item.key)}
                  style={({ pressed }) => [
                    styles.selectedSummaryRow,
                    !item.isActive ? styles.selectedSummaryRowInactive : null,
                    pressed ? styles.selectedSummaryRowPressed : null,
                  ]}
                >
                  <View
                    style={[
                      styles.selectedSummaryDot,
                      {
                        backgroundColor: item.isActive
                          ? (itemColorByKey.get(item.key) ?? AppChartColors[0])
                          : AppColors.surfaceStrong,
                      },
                    ]}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.selectedSummaryLabel,
                      !item.isActive ? styles.selectedSummaryTextInactive : null,
                    ]}
                  >
                    {item.label}
                  </Text>
                  <View style={styles.selectedSummaryValueBlock}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.selectedSummaryAmount,
                        !item.isActive ? styles.selectedSummaryTextInactive : null,
                      ]}
                    >
                      {formatCurrency(item.amount)}
                    </Text>
                    <Text style={styles.selectedSummaryShare}>
                      {item.isActive ? `${Math.round(item.share * 100)}%` : ""}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
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
  content: {
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
    justifyContent: "center",
    alignItems: "center",
  },
  chartOverview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    color: AppColors.mutedText,
    fontSize: 12,
    lineHeight: 18,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  selectedSummary: {
    gap: MonthlyInsightChartLayout.donutLegendGap,
  },
  selectedSummaryAmount: {
    color: AppColors.text,
    fontSize: 11,
    fontWeight: "700",
  },
  selectedSummaryLabel: {
    flex: 1,
    minWidth: 0,
    color: AppColors.text,
    fontSize: 11,
    fontWeight: "600",
  },
  selectedSummaryList: {
    flex: 1,
    maxHeight: MonthlyInsightChartLayout.donutSize,
    minWidth: 0,
  },
  selectedSummaryDot: {
    borderRadius: MonthlyInsightChartLayout.donutLegendDotSize / 2,
    height: MonthlyInsightChartLayout.donutLegendDotSize,
    width: MonthlyInsightChartLayout.donutLegendDotSize,
  },
  selectedSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    minHeight: MonthlyInsightChartLayout.donutLegendRowMinHeight,
    paddingHorizontal: MonthlyInsightChartLayout.donutLegendRowPaddingHorizontal,
  },
  selectedSummaryRowInactive: {
    opacity: MonthlyInsightChartLayout.donutLegendInactiveOpacity,
  },
  selectedSummaryRowPressed: {
    backgroundColor: AppColors.surfaceMuted,
  },
  selectedSummaryShare: {
    color: AppColors.mutedText,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "right",
    minWidth: 32,
  },
  selectedSummaryValueBlock: {
    flexDirection: "row",
    alignItems: "flex-end",
    minWidth: 54,
  },
  selectedSummaryTextInactive: {
    color: AppColors.mutedStrongText,
    textDecorationLine: "line-through",
  },
});
