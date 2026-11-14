import { createThemeValue } from "../../lib/appTheme";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useEffect, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { getAppColors } from "../../constants/colors";
import {
  MonthlyInsightChartCopy as Copy,
  MonthlyInsightChartLayout as Layout,
} from "../../constants/monthlyInsightCharts";
import { getCompactLabelTextStyle } from "../../constants/uiStyles";
import { OneLineTextFitProps } from "../../constants/textLayout";
import type { MonthlyTrendPoint } from "../../types/ledger";
import { formatCurrency } from "../../utils/currency";

export function TrendChartTooltip({
  point,
  anchorX,
  plotWidth,
  onDismiss,
}: {
  point: MonthlyTrendPoint;
  anchorX: number;
  plotWidth: number;
  onDismiss: () => void;
}) {
  const styles = getStyles();
  useAppTheme();
  const [opacity] = useState(() => new Animated.Value(0));
  const [tooltipWidth, setTooltipWidth] = useState(0);
  const ready = tooltipWidth > 0 && plotWidth > 0;
  const left = Math.max(0, Math.min(anchorX - tooltipWidth / 2, plotWidth - tooltipWidth));
  useEffect(() => {
    if (!ready) return;
    const fadeIn = Animated.timing(opacity, {
      toValue: 1,
      duration: Layout.trendTooltipFadeMs,
      useNativeDriver: true,
    });
    const fadeOut = Animated.timing(opacity, {
      toValue: 0,
      duration: Layout.trendTooltipFadeMs,
      useNativeDriver: true,
    });
    fadeIn.start();
    const timer = setTimeout(
      () =>
        fadeOut.start(({ finished }) => {
          if (finished) onDismiss();
        }),
      Layout.trendTooltipDurationMs,
    );
    return () => {
      clearTimeout(timer);
      fadeIn.stop();
      fadeOut.stop();
    };
  }, [opacity, onDismiss, ready]);
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      onLayout={({ nativeEvent }) => setTooltipWidth(nativeEvent.layout.width)}
      style={[styles.tooltip, { opacity, left, maxWidth: plotWidth || "100%" }]}
    >
      <Text {...OneLineTextFitProps} style={styles.title}>
        {point.monthLabel}
      </Text>
      <View style={styles.row}>
        <Text style={styles.income}>{Copy.incomeLabel}</Text>
        <Text {...OneLineTextFitProps} style={styles.amount}>
          {formatCurrency(point.incomeAmount)}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.expense}>{Copy.expenseLabel}</Text>
        <Text {...OneLineTextFitProps} style={styles.amount}>
          {formatCurrency(point.expenseAmount)}
        </Text>
      </View>
    </Animated.View>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    tooltip: {
      position: "absolute",
      top: 0,
      maxWidth: "100%",
      padding: Layout.trendTooltipPadding,
      gap: Layout.trendTooltipGap,
      borderRadius: Layout.trendTooltipRadius,
      backgroundColor: getAppColors().floatingPanelSurface,
      borderWidth: Layout.trendGridLineWidth,
      borderColor: getAppColors().border,
    },
    row: { flexDirection: "row", alignItems: "center", gap: Layout.trendTooltipPadding },
    title: { ...getCompactLabelTextStyle(), color: getAppColors().text, fontWeight: "700" },
    amount: { ...getCompactLabelTextStyle(), flexShrink: 1, color: getAppColors().text },
    income: { ...getCompactLabelTextStyle(), color: getAppColors().income },
    expense: { ...getCompactLabelTextStyle(), color: getAppColors().expense },
  }),
);
