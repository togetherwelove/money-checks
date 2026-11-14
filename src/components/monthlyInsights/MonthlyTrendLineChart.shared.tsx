import { createThemeValue } from "../../lib/appTheme";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useCallback, useEffect, useState } from "react";
import Svg, { Circle, G, Line } from "react-native-svg";
import { type StyleProp, StyleSheet, Pressable, Text, type TextStyle, View } from "react-native";

import { getAppColors } from "../../constants/colors";
import { getCardTitleTextStyle, getCompactLabelTextStyle } from "../../constants/uiStyles";
import {
  MonthlyInsightChartCopy,
  MonthlyInsightChartLayout,
} from "../../constants/monthlyInsightCharts";
import { CompactTextProps, OneLineTextFitProps } from "../../constants/textLayout";
import { useExpenseTextColor } from "../../contexts/ExpenseTextColorContext";
import type { MonthlyTrendPoint } from "../../types/ledger";
import { formatChartAxisCurrency } from "../../utils/currency";
import { TrendChartTooltip } from "./TrendChartTooltip";
import { buildChartAxis } from "../../utils/chartAxis";

type MonthlyTrendLineChartProps = {
  title?: string;
  trendMonths: MonthlyTrendPoint[];
};

export function MonthlyTrendLineChart({
  title = MonthlyInsightChartCopy.trendTitle,
  trendMonths,
}: MonthlyTrendLineChartProps) {
  const styles = getStyles();
  useAppTheme();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [plotWidth, setPlotWidth] = useState(0);
  const dismissTooltip = useCallback(() => setSelectedKey(null), []);
  useEffect(() => {
    setSelectedKey(null);
  }, [trendMonths, title]);
  const selectedIndex = trendMonths.findIndex((point) => point.key === selectedKey);
  const selectedPoint = selectedIndex >= 0 ? trendMonths[selectedIndex] : undefined;
  const expenseTextStyle = useExpenseTextColor().textStyle;
  const dataMaximum = Math.max(
    ...trendMonths.flatMap((point) => [point.incomeAmount, point.expenseAmount]),
    0,
  );
  const { maximum: maxAmount, ticks: yAxisTicks } = buildChartAxis(
    dataMaximum,
    MonthlyInsightChartLayout.trendYAxisLabelCount,
  );

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text {...CompactTextProps} accessibilityRole="header" style={styles.sectionTitle}>
          {title}
        </Text>
        <View style={styles.legend}>
          <LegendItem color={getAppColors().income} label={MonthlyInsightChartCopy.incomeLabel} />
          <LegendItem
            color={getAppColors().expense}
            label={MonthlyInsightChartCopy.expenseLabel}
            textStyle={expenseTextStyle}
          />
        </View>
      </View>
      <View style={styles.chartFrame}>
        <View style={styles.plotRow}>
          <View style={styles.yAxis}>
            <View
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={styles.axisMeasurement}
            >
              {yAxisTicks.map((tick) => (
                <Text key={tick.key} {...OneLineTextFitProps} style={styles.axisText}>
                  {formatChartAxisCurrency(tick.amount)}
                </Text>
              ))}
            </View>
            {yAxisTicks.map((tick) => (
              <Text
                key={tick.key}
                {...OneLineTextFitProps}
                style={[
                  styles.axisText,
                  styles.yAxisLabel,
                  {
                    bottom:
                      maxAmount > 0
                        ? (tick.amount / maxAmount) * MonthlyInsightChartLayout.trendLineHeight
                        : 0,
                  },
                ]}
              >
                {formatChartAxisCurrency(tick.amount)}
              </Text>
            ))}
          </View>
          <View style={styles.chartContent}>
            <View
              style={styles.chartBody}
              onLayout={({ nativeEvent }) => setPlotWidth(nativeEvent.layout.width)}
            >
              <View pointerEvents="none" style={styles.gridLayer}>
                {yAxisTicks.map((tick) => (
                  <View
                    key={tick.key}
                    style={[
                      styles.gridLine,
                      {
                        bottom:
                          maxAmount > 0
                            ? (tick.amount / maxAmount) * MonthlyInsightChartLayout.trendLineHeight
                            : 0,
                      },
                    ]}
                  />
                ))}
              </View>
              <Svg
                width="100%"
                height={MonthlyInsightChartLayout.trendLineHeight}
                style={styles.linePlot}
              >
                {selectedPoint ? (
                  <Line
                    x1={`${((selectedIndex + 0.5) / trendMonths.length) * 100}%`}
                    x2={`${((selectedIndex + 0.5) / trendMonths.length) * 100}%`}
                    y1={0}
                    y2={MonthlyInsightChartLayout.trendLineHeight}
                    stroke={getAppColors().mutedStrongText}
                    strokeWidth={MonthlyInsightChartLayout.trendGridLineWidth}
                  />
                ) : null}
                <TrendLine
                  trendMonths={trendMonths}
                  amountKey="incomeAmount"
                  color={getAppColors().income}
                  maxAmount={maxAmount}
                />
                <TrendLine
                  trendMonths={trendMonths}
                  amountKey="expenseAmount"
                  color={getAppColors().expense}
                  maxAmount={maxAmount}
                />
              </Svg>
              <View style={styles.touchLayer}>
                {trendMonths.map((point) => (
                  <Pressable
                    key={point.key}
                    style={styles.touchColumn}
                    accessibilityRole="button"
                    accessibilityLabel={point.monthLabel}
                    accessibilityState={{ selected: point.key === selectedKey }}
                    onPress={() =>
                      setSelectedKey((current) => (current === point.key ? null : point.key))
                    }
                  />
                ))}
              </View>
              {selectedPoint ? (
                <TrendChartTooltip
                  key={selectedPoint.key}
                  point={selectedPoint}
                  anchorX={((selectedIndex + 0.5) / trendMonths.length) * plotWidth}
                  plotWidth={plotWidth}
                  onDismiss={dismissTooltip}
                />
              ) : null}
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

function TrendLine({
  trendMonths,
  amountKey,
  color,
  maxAmount,
}: {
  trendMonths: MonthlyTrendPoint[];
  amountKey: "incomeAmount" | "expenseAmount";
  color: string;
  maxAmount: number;
}) {
  useAppTheme();
  const position = (index: number) => ({
    x: `${((index + 0.5) / trendMonths.length) * 100}%`,
    y:
      MonthlyInsightChartLayout.trendLineHeight *
      (1 - (maxAmount > 0 ? trendMonths[index][amountKey] / maxAmount : 0)),
  });
  return (
    <>
      {trendMonths.map((point, index) => {
        const current = position(index);
        const previous = index > 0 ? position(index - 1) : null;
        return (
          <G key={point.key}>
            {previous ? (
              <Line
                x1={previous.x}
                y1={previous.y}
                x2={current.x}
                y2={current.y}
                stroke={color}
                strokeWidth={MonthlyInsightChartLayout.trendLineWidth}
              />
            ) : null}
            <Circle
              cx={current.x}
              cy={current.y}
              r={MonthlyInsightChartLayout.trendPointRadius}
              fill={color}
            />
          </G>
        );
      })}
    </>
  );
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
  const styles = getStyles();
  useAppTheme();
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text {...CompactTextProps} style={[styles.legendText, textStyle]}>
        {label}
      </Text>
    </View>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    activeMonth: {
      color: getAppColors().text,
      fontWeight: "800",
    },
    chartFrame: {
      gap: 12,
    },
    chartBody: {
      height: MonthlyInsightChartLayout.trendLineHeight,
      justifyContent: "flex-end",
    },
    chartContent: {
      flex: 1,
      gap: 6,
      minWidth: 0,
    },
    touchLayer: { ...StyleSheet.absoluteFill, flexDirection: "row" },
    touchColumn: { flex: 1 },
    linePlot: { overflow: "visible" },
    gridLayer: {
      ...StyleSheet.absoluteFill,
    },
    gridLine: {
      position: "absolute",
      left: 0,
      right: 0,
      height: MonthlyInsightChartLayout.trendGridLineWidth,
      backgroundColor: getAppColors().border,
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
      ...getCompactLabelTextStyle(),
    },
    monthLabel: {
      ...getCompactLabelTextStyle(),
      flex: 1,
      minWidth: 0,
      textAlign: "center",
    },
    monthLabelRow: {
      flexDirection: "row",
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
      ...getCardTitleTextStyle(),
    },
    yAxis: {
      alignItems: "flex-end",
      height: MonthlyInsightChartLayout.trendLineHeight,
    },
    yAxisLabel: {
      position: "absolute",
      left: 0,
      right: 0,
      transform: [{ translateY: MonthlyInsightChartLayout.trendYAxisLabelLineHeight / 2 }],
      height: MonthlyInsightChartLayout.trendYAxisLabelLineHeight,
      lineHeight: MonthlyInsightChartLayout.trendYAxisLabelLineHeight,
      color: getAppColors().mutedText,
      textAlign: "right",
    },
    axisMeasurement: { opacity: 0 },
    axisText: {
      fontSize: MonthlyInsightChartLayout.trendYAxisLabelFontSize,
      fontWeight: "600",
      lineHeight: MonthlyInsightChartLayout.trendYAxisLabelLineHeight,
    },
  }),
);
