import { Chart, Host } from "@expo/ui/swift-ui";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { StyleSheet, Text, View } from "react-native";
import { AppColors } from "../../constants/colors";
import { MonthlyInsightChartCopy as Copy, MonthlyInsightChartLayout as Layout } from "../../constants/monthlyInsightCharts";
import { FormLabelTextStyle } from "../../constants/uiStyles";
import type { MonthlyTrendPoint } from "../../types/ledger";

export function MonthlyTrendBarChart({ title = Copy.trendTitle, trendMonths }: { title?: string; trendMonths: MonthlyTrendPoint[] }) {
  const data = trendMonths.flatMap(point => [
    { x: `${point.monthLabel} ${Copy.incomeLabel}`, y: point.incomeAmount, color: AppColors.income },
    { x: `${point.monthLabel} ${Copy.expenseLabel}`, y: point.expenseAmount, color: AppColors.expense },
  ]);
  return <View>
    <Text accessibilityRole="header" style={FormLabelTextStyle}>{title}</Text>
    <Host style={styles.chart}>
      <Chart type="bar" data={data} showGrid showLegend={false} animate={false}
        modifiers={[frame({ height: Layout.nativeTrendHeight })]} />
    </Host>
  </View>;
}

const styles = StyleSheet.create({ chart: { height: Layout.nativeTrendHeight } });
