import { Pressable, StyleSheet, Text, View } from "react-native";
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
          </>
        ) : (
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        )}
        {visibleLegendItems.length ? (
          <View style={styles.legend}>
            {visibleLegendItems.map((item, index) => (
              <Pressable
                accessibilityLabel={`${item.label} ${
                  item.isActive
                    ? MonthlyInsightChartCopy.visibleItemAccessibilitySuffix
                    : MonthlyInsightChartCopy.hiddenItemAccessibilitySuffix
                }`}
                accessibilityRole="button"
                accessibilityState={{ checked: item.isActive }}
                key={`${item.key}-${item.amount}-legend`}
                onPress={() => onToggleItem?.(item.key)}
                style={({ pressed }) => [
                  styles.legendRow,
                  !item.isActive ? styles.legendRowInactive : null,
                  pressed ? styles.legendRowPressed : null,
                ]}
              >
                <View
                  style={[
                    styles.legendDot,
                    {
                      backgroundColor: AppChartColors[index % AppChartColors.length],
                    },
                    !item.isActive ? styles.legendDotInactive : null,
                  ]}
                />
                <Text
                  numberOfLines={1}
                  style={[styles.legendLabel, !item.isActive ? styles.legendLabelInactive : null]}
                >
                  {item.label}
                </Text>
                <Text
                  style={[styles.legendAmount, !item.isActive ? styles.legendAmountInactive : null]}
                >
                  {formatCurrency(item.amount)}
                  {item.isActive ? ` (${Math.round(item.share * 100)}%)` : ""}
                </Text>
                <View
                  style={[
                    styles.legendToggle,
                    item.isActive ? styles.legendToggleActive : styles.legendToggleInactive,
                  ]}
                />
              </Pressable>
            ))}
          </View>
        ) : null}
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
    gap: 6,
  },
  legendAmount: {
    color: AppColors.mutedText,
    fontSize: 12,
    fontWeight: "600",
  },
  legendAmountInactive: {
    color: AppColors.mutedStrongText,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  legendDotInactive: {
    backgroundColor: AppColors.surfaceStrong,
  },
  legendLabel: {
    flex: 1,
    minWidth: 0,
    color: AppColors.text,
    fontSize: 12,
    fontWeight: "600",
  },
  legendLabelInactive: {
    color: AppColors.mutedStrongText,
    textDecorationLine: "line-through",
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    marginHorizontal: -4,
    minHeight: 32,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  legendRowInactive: {
    opacity: 0.72,
  },
  legendRowPressed: {
    backgroundColor: AppColors.surfaceMuted,
  },
  legendToggle: {
    width: 16,
    height: 16,
    borderRadius: 999,
    borderWidth: 1,
  },
  legendToggleActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  legendToggleInactive: {
    backgroundColor: AppColors.transparent,
    borderColor: AppColors.border,
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
