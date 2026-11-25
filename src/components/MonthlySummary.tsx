import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import { type ReactNode, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { MenuView } from "@react-native-menu/menu";

import {
  formatCalendarSummaryBalanceLabel,
  CalendarSummaryLabels,
  CalendarSummaryBaseDayOptions,
  CalendarSummaryModeOptions,
  CalendarSummaryModes,
  type CalendarSummaryMode,
} from "../constants/calendarSummary";
import { getCashflowTotalStyles } from "../constants/cashflowTotalStyles";
import { getAppColors } from "../constants/colors";
import { MonthlySummaryUi as Ui } from "../constants/home";
import { AppLayout } from "../constants/layout";
import { OneLineTextFitProps } from "../constants/textLayout";
import { useExpenseTextColor } from "../contexts/ExpenseTextColorContext";
import { formatCurrency } from "../utils/calendar";

type MonthlySummaryProps = {
  balanceAmount: number;
  balanceLabel?: string;
  calendarSummaryMode: CalendarSummaryMode;
  calendarSummaryBaseDay?: number | null;
  onSelectSummaryMode?: (mode: CalendarSummaryMode, day?: number) => void;
  summaryLabel: string;
  totalExpense: string;
  totalIncome: string;
};

export function MonthlySummary({
  balanceAmount,
  balanceLabel,
  calendarSummaryMode,
  calendarSummaryBaseDay,
  onSelectSummaryMode,
  summaryLabel,
  totalExpense,
  totalIncome,
}: MonthlySummaryProps) {
  const styles = getStyles();
  useAppTheme();
  const expenseTextColor = useExpenseTextColor().textColor;
  const { fontScale } = useWindowDimensions();
  const [contentWidth, setContentWidth] = useState(0);
  const balanceValue =
    balanceLabel ??
    `${balanceAmount > 0 ? "+" : balanceAmount < 0 ? "-" : ""}${formatCurrency(Math.abs(balanceAmount))}`;
  const stacked = contentWidth > 0 && contentWidth < Ui.minimumRowWidth * fontScale;
  const balanceTitle = formatCalendarSummaryBalanceLabel(calendarSummaryMode, summaryLabel);
  const balanceMetricLabel = (
    <Text {...OneLineTextFitProps} style={styles.metricLabel}>
      {balanceTitle}
    </Text>
  );

  return (
    <View style={styles.container}>
      <View
        onLayout={(event) => setContentWidth(event.nativeEvent.layout.width)}
        style={[styles.metrics, stacked && styles.stackedMetrics]}
      >
        <SummaryMetric
          label={CalendarSummaryLabels.expense}
          value={totalExpense}
          color={expenseTextColor}
          stacked={stacked}
        />
        <SummaryMetric
          label={CalendarSummaryLabels.income}
          value={totalIncome}
          color={getAppColors().income}
          stacked={stacked}
        />
        <SummaryMetric
          label={balanceTitle}
          labelContent={
            onSelectSummaryMode ? (
              <MenuView
                actions={CalendarSummaryModeOptions.map(({ value, label }) => ({
                  id: value,
                  title: label,
                  state: value === calendarSummaryMode ? "on" : "off",
                  subactions:
                    value === CalendarSummaryModes.selectedMonth
                      ? CalendarSummaryBaseDayOptions.map((day) => ({
                          id: String(day.value),
                          title: day.label,
                          state:
                            calendarSummaryMode === value && calendarSummaryBaseDay === day.value
                              ? "on"
                              : "off",
                        }))
                      : undefined,
                }))}
                onPressAction={({ nativeEvent }) => {
                  const day = CalendarSummaryBaseDayOptions.find(
                    ({ value }) => String(value) === nativeEvent.event,
                  );
                  if (day) {
                    onSelectSummaryMode(CalendarSummaryModes.selectedMonth, day.value);
                    return;
                  }
                  const option = CalendarSummaryModeOptions.find(
                    ({ value }) => value === nativeEvent.event,
                  );
                  if (option && option.value !== CalendarSummaryModes.selectedMonth)
                    onSelectSummaryMode(option.value);
                }}
                style={[styles.settingsMenu, !stacked && styles.trailingLabel]}
              >
                <View
                  accessibilityLabel={`${balanceTitle}, ${CalendarSummaryLabels.changePeriod}`}
                  accessibilityRole="button"
                  style={styles.settingsButton}
                >
                  {balanceMetricLabel}
                  <View style={styles.settingsTriangle} />
                </View>
              </MenuView>
            ) : null
          }
          value={balanceValue}
          color={!balanceLabel && balanceAmount > 0 ? getAppColors().income : getAppColors().text}
          stacked={stacked}
          trailing
        />
      </View>
    </View>
  );
}

function SummaryMetric({
  label,
  labelContent,
  value,
  color,
  stacked,
  trailing = false,
}: {
  label: string;
  labelContent?: ReactNode;
  value: string;
  color: string;
  stacked: boolean;
  trailing?: boolean;
}) {
  const styles = getStyles();
  useAppTheme();
  return (
    <View style={[styles.metric, stacked && styles.stackedMetric]}>
      {labelContent ?? (
        <Text
          {...OneLineTextFitProps}
          style={[styles.metricLabel, trailing && !stacked && styles.trailingValue]}
        >
          {label}
        </Text>
      )}
      <Text
        {...OneLineTextFitProps}
        style={[
          styles.metricValue,
          { color },
          trailing && styles.trailingValue,
          stacked && styles.stackedValue,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    container: { ...getCashflowTotalStyles().totalsCard },
    settingsMenu: { alignSelf: "flex-start", maxWidth: "100%", flexShrink: 1 },
    settingsButton: {
      alignItems: "center",
      flexDirection: "row",
      gap: AppLayout.compactGap,
      maxWidth: "100%",
      flexShrink: 1,
    },
    settingsTriangle: {
      width: 0,
      height: 0,
      borderLeftWidth: AppLayout.compactGap,
      borderRightWidth: AppLayout.compactGap,
      borderTopWidth: AppLayout.compactGap,
      borderLeftColor: "transparent",
      borderRightColor: "transparent",
      borderTopColor: getCashflowTotalStyles().totalLabel.color,
    },
    metrics: { flexDirection: "row", justifyContent: "space-between", gap: Ui.contentGap },
    stackedMetrics: { flexDirection: "column" },
    metric: { flex: 1, minWidth: 0, gap: Ui.metricGap },
    stackedMetric: {
      flex: 0,
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
    },
    metricLabel: {
      ...getCashflowTotalStyles().totalLabel,
      flexShrink: 1,
    },
    metricValue: getCashflowTotalStyles().totalAmount,
    trailingLabel: { alignSelf: "flex-end" },
    trailingValue: { textAlign: "right" },
    stackedValue: { flexShrink: 1, textAlign: "right" },
  }),
);
