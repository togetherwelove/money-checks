import { Platform } from "react-native";
import { BreakdownDonutGraphic as FallbackDonut } from "./BreakdownDonutGraphic.fallback";
import { Chart, Host } from "@expo/ui/swift-ui";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { MonthlyInsightChartLayout as Layout } from "../../constants/monthlyInsightCharts";

export type DonutSlice = { key: string; label: string; amount: number; share: number; color: string };

export function BreakdownDonutGraphic({ items }: { items: DonutSlice[] }) {
  if (parseFloat(String(Platform.Version)) < Layout.nativePieMinimumIOSVersion) return <FallbackDonut items={items} />;
  return <Host style={{ width: Layout.donutSize, height: Layout.donutSize }}>
    <Chart type="pie" data={items.filter(item => item.amount > 0).map(item => ({ x: item.label, y: item.amount, color: item.color }))}
      showGrid={false} showLegend={false} animate={false}
      pieStyle={{ innerRadius: (Layout.donutSize - Layout.donutStrokeWidth * 2) / Layout.donutSize, opacity: 1 }}
      modifiers={[frame({ width: Layout.donutSize, height: Layout.donutSize })]} />
  </Host>;
}
