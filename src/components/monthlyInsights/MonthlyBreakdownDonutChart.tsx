import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

import {
  CATEGORY_GRID_GAP,
  CATEGORY_GRID_MIN_CELL_SIZE,
  CATEGORY_ICON_LABEL_GAP,
  CATEGORY_ICON_SIZE,
  CATEGORY_ITEM_PADDING_HORIZONTAL,
  CATEGORY_ITEM_PADDING_VERTICAL,
} from "../../constants/categorySelector";
import { AppChartColors, AppColors } from "../../constants/colors";
import {
  MonthlyInsightChartCopy,
  MonthlyInsightChartLayout,
} from "../../constants/monthlyInsightCharts";
import { AppTextBreakProps } from "../../constants/textLayout";
import type { CategoryIconName } from "../../types/category";
import { formatCurrency } from "../../utils/calendar";

type MonthlyBreakdownItem = {
  amount: number;
  iconName?: CategoryIconName;
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
  legendLayout?: "grid" | "row";
  legendItems?: MonthlyBreakdownLegendItem[];
  onToggleItem?: (itemKey: string) => void;
  title: string;
};

const CHART_RADIUS =
  (MonthlyInsightChartLayout.donutSize - MonthlyInsightChartLayout.donutStrokeWidth) / 2;
const CHART_CIRCUMFERENCE = 2 * Math.PI * CHART_RADIUS;
const FALLBACK_CATEGORY_ICON_NAME: CategoryIconName = "grid";

export function MonthlyBreakdownDonutChart({
  centerLabel,
  emptyMessage,
  items,
  legendLayout = "row",
  legendItems,
  onToggleItem,
  title,
}: MonthlyBreakdownDonutChartProps) {
  const [legendGridWidth, setLegendGridWidth] = useState(0);
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const visibleLegendItems =
    legendItems ?? items.map((item) => ({ ...item, isActive: true }));
  const legendGridItemSize = resolveLegendGridItemSize(legendGridWidth);
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
            <View style={styles.selectedSummary}>
              {items.map((item) => (
                <View key={`${item.key}-${item.amount}-summary`} style={styles.selectedSummaryRow}>
                  <Text numberOfLines={1} style={styles.selectedSummaryLabel}>
                    {item.label}
                  </Text>
                  <View style={styles.selectedSummaryValueBlock}>
                    <Text numberOfLines={1} style={styles.selectedSummaryAmount}>
                      {formatCurrency(item.amount)}
                    </Text>
                    <Text style={styles.selectedSummaryShare}>
                      {Math.round(item.share * 100)}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        )}
        {visibleLegendItems.length ? (
          <View
            onLayout={
              legendLayout === "grid"
                ? (event) => setLegendGridWidth(event.nativeEvent.layout.width)
                : undefined
            }
            style={legendLayout === "grid" ? styles.legendGrid : styles.legend}
          >
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
                  legendLayout === "grid" ? styles.legendGridItem : styles.legendRow,
                  legendLayout === "grid"
                    ? {
                        height: legendGridItemSize,
                        width: legendGridItemSize,
                      }
                    : null,
                  legendLayout === "grid" && !item.isActive
                    ? styles.legendGridItemInactive
                    : null,
                  legendLayout === "row" && !item.isActive ? styles.legendRowInactive : null,
                  pressed
                    ? legendLayout === "grid"
                      ? styles.legendGridItemPressed
                      : styles.legendRowPressed
                    : null,
                ]}
              >
                {legendLayout === "grid" ? (
                  <GridLegendContent item={item} />
                ) : (
                  <RowLegendContent item={item} itemIndex={index} />
                )}
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function resolveLegendGridItemSize(legendGridWidth: number): number {
  if (legendGridWidth <= 0) {
    return CATEGORY_GRID_MIN_CELL_SIZE;
  }

  const totalGap =
    CATEGORY_GRID_GAP * (MonthlyInsightChartLayout.categoryLegendGridColumns - 1);
  return Math.max(
    0,
    (legendGridWidth - totalGap) / MonthlyInsightChartLayout.categoryLegendGridColumns,
  );
}

function GridLegendContent({ item }: { item: MonthlyBreakdownLegendItem }) {
  return (
    <>
      <View
        style={[
          styles.legendGridIconFrame,
          item.isActive ? styles.legendGridIconFrameActive : null,
        ]}
      >
        <Feather
          color={item.isActive ? AppColors.primary : AppColors.mutedText}
          name={item.iconName ?? FALLBACK_CATEGORY_ICON_NAME}
          size={CATEGORY_ICON_SIZE}
        />
      </View>
      <Text
        {...AppTextBreakProps}
        adjustsFontSizeToFit
        minimumFontScale={0.86}
        numberOfLines={1}
        style={[styles.legendGridLabel, item.isActive ? styles.legendGridLabelActive : null]}
      >
        {item.label}
      </Text>
    </>
  );
}

function RowLegendContent({
  item,
  itemIndex,
}: {
  item: MonthlyBreakdownLegendItem;
  itemIndex: number;
}) {
  return (
    <>
      <View
        style={[
          styles.legendDot,
          {
            backgroundColor: AppChartColors[itemIndex % AppChartColors.length],
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
      <Text style={[styles.legendAmount, !item.isActive ? styles.legendAmountInactive : null]}>
        {formatCurrency(item.amount)}
        {item.isActive ? ` (${Math.round(item.share * 100)}%)` : ""}
      </Text>
      <View
        style={[
          styles.legendToggle,
          item.isActive ? styles.legendToggleActive : styles.legendToggleInactive,
        ]}
      />
    </>
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
  legend: {
    gap: 6,
  },
  legendGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CATEGORY_GRID_GAP,
  },
  legendGridItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: CATEGORY_ICON_LABEL_GAP,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.transparent,
    borderRadius: 14,
    backgroundColor: AppColors.transparent,
    paddingHorizontal: CATEGORY_ITEM_PADDING_HORIZONTAL,
    paddingVertical: CATEGORY_ITEM_PADDING_VERTICAL,
  },
  legendGridItemInactive: {
    opacity: 0.68,
  },
  legendGridItemPressed: {
    backgroundColor: AppColors.surfaceMuted,
  },
  legendGridIconFrame: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.transparent,
    backgroundColor: AppColors.surfaceMuted,
  },
  legendGridIconFrameActive: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primarySoft,
  },
  legendGridLabel: {
    color: AppColors.mutedText,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  legendGridLabelActive: {
    color: AppColors.primary,
    fontWeight: "700",
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
  selectedSummary: {
    flex: 1,
    minWidth: 0,
    gap: 5,
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
  selectedSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
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
});
