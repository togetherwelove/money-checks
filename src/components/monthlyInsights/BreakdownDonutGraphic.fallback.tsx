import Svg, { Circle, G } from "react-native-svg";
import { AppColors } from "../../constants/colors";
import { MonthlyInsightChartLayout as Layout } from "../../constants/monthlyInsightCharts";

export type DonutSlice = { key: string; label: string; amount: number; share: number; color: string };
const radius = (Layout.donutSize - Layout.donutStrokeWidth) / 2;
const circumference = 2 * Math.PI * radius;

export function BreakdownDonutGraphic({ items }: { items: DonutSlice[] }) {
  let previousShare = 0;
  return <Svg height={Layout.donutSize} width={Layout.donutSize}>
    <G origin={`${Layout.donutSize / 2}, ${Layout.donutSize / 2}`} rotation="-90">
      <Circle cx={Layout.donutSize / 2} cy={Layout.donutSize / 2} fill="transparent" r={radius}
        stroke={AppColors.surfaceMuted} strokeWidth={Layout.donutStrokeWidth} />
      {items.map(item => {
        const offset = -circumference * previousShare;
        previousShare += item.share;
        return <Circle key={item.key} cx={Layout.donutSize / 2} cy={Layout.donutSize / 2} fill="transparent" r={radius}
          stroke={item.color} strokeDasharray={`${circumference * item.share} ${circumference}`}
          strokeDashoffset={offset} strokeWidth={Layout.donutStrokeWidth} />;
      })}
    </G>
  </Svg>;
}
