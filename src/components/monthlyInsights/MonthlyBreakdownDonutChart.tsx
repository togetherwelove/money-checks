import { AppScrollBehavior } from "../../constants/scroll";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { BreakdownDonutGraphic } from "./BreakdownDonutGraphic";

import { AppChartColors, AppColors } from "../../constants/colors";
import {
  MonthlyInsightChartCopy,
  MonthlyInsightChartLayout,
} from "../../constants/monthlyInsightCharts";
import {
  AppTextScale,
  CompactTextProps,
  resolveTextScale,
} from "../../constants/textLayout";
import { useExpenseTextColor } from "../../contexts/ExpenseTextColorContext";
import { CardTitleTextStyle, CompactLabelTextStyle, FormLabelTextStyle, SupportingTextStyle } from "../../constants/uiStyles";
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
  variant: "expense" | "income";
};

export function MonthlyBreakdownDonutChart({
  centerLabel,
  emptyMessage,
  items,
  legendItems,
  onToggleItem,
  title,
  variant,
}: MonthlyBreakdownDonutChartProps) {
  const { fontScale, width: windowWidth } = useWindowDimensions();
  const compactFontScale = resolveTextScale(fontScale, AppTextScale.compact);
  const shouldStackContent =
    windowWidth < MonthlyInsightChartLayout.donutStackBreakpointWidth * compactFontScale;
  const expenseTextStyle = useExpenseTextColor().textStyle;
  const semanticTextStyle = variant === "expense" ? expenseTextStyle : null;
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
      <Text {...CompactTextProps} accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      <View style={styles.content}>
        {visibleLegendItems.length ? (
          <View
            style={[
              styles.chartOverview,
              shouldStackContent ? styles.stackedChartOverview : null,
            ]}
          >
            <View style={styles.chartShell}>
              <BreakdownDonutGraphic items={items.map((item, index) => ({ ...item,
                color: itemColorByKey.get(item.key) ?? AppChartColors[index % AppChartColors.length],
              }))} />
              <View pointerEvents="none" style={styles.chartCenter}>
                <Text {...CompactTextProps} style={styles.centerLabel}>
                  {centerLabel}
                </Text>
                <Text {...CompactTextProps} style={[styles.centerValue, semanticTextStyle]}>
                  {formatCurrency(totalAmount)}
                </Text>
              </View>
            </View>
            <ScrollView {...AppScrollBehavior}
              contentContainerStyle={styles.selectedSummary}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              style={[styles.selectedSummaryList, shouldStackContent ? styles.stackedSummaryList : null]}
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
                    {...CompactTextProps}
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
                      {...CompactTextProps}
                      numberOfLines={1}
                      style={[
                        styles.selectedSummaryAmount,
                        semanticTextStyle,
                        !item.isActive ? styles.selectedSummaryTextInactive : null,
                      ]}
                    >
                      {formatCurrency(item.amount)}
                    </Text>
                    <Text
                      {...CompactTextProps}
                      style={[
                        styles.selectedSummaryShare,
                        !item.isActive ? styles.selectedSummaryTextInactive : null,
                      ]}
                    >
                      {item.isActive ? `${Math.round(item.share * 100)}%` : ""}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : (
          <Text {...CompactTextProps} style={styles.emptyText}>{emptyMessage}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
  },
  centerLabel: {
    ...CompactLabelTextStyle,
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
    width: MonthlyInsightChartLayout.donutSize,
    height: MonthlyInsightChartLayout.donutSize,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  chartOverview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    ...SupportingTextStyle,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    ...CardTitleTextStyle,
  },
  selectedSummary: {
    gap: MonthlyInsightChartLayout.donutLegendGap,
  },
  selectedSummaryAmount: {
    ...FormLabelTextStyle,
    color: AppColors.text,
  },
  selectedSummaryLabel: {
    ...FormLabelTextStyle,
    flex: 1,
    minWidth: 0,
    color: AppColors.text,
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
    ...CompactLabelTextStyle,
    textAlign: "right",
    minWidth: 32,
  },
  selectedSummaryValueBlock: {
    alignItems: "flex-end",
    minWidth: 54,
  },
  selectedSummaryTextInactive: {
    color: AppColors.mutedStrongText,
    textDecorationLine: "line-through",
  },
  stackedChartOverview: {
    alignItems: "stretch",
    flexDirection: "column",
  },
  stackedSummaryList: {
    flex: 0,
    width: "100%",
  },
});
