import { useId, useState } from "react";
import { Animated } from "react-native";
import Svg, {
  Ellipse,
  ClipPath,
  Defs,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";
import {
  ExpenseMountainLayout as Ui,
  getExpenseComparisonColors,
} from "../../constants/monthlyInsightCharts";
import { useExpenseChartReveal } from "../../hooks/useExpenseChartReveal";
import type { ExpenseComparisonChart } from "../../utils/expenseComparisonChart";

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedGroup = Animated.createAnimatedComponent(G);

export function ExpenseComparisonGraphic({
  chart,
  isActive,
  currentColor = getExpenseComparisonColors().current,
}: {
  chart: ExpenseComparisonChart;
  isActive: boolean;
  currentColor?: string;
}) {
  const clipId = `expense-reveal-${useId().replace(/:/g, "")}`;
  const gradientId = `${clipId}-previous-fill`;
  const progress = useExpenseChartReveal(chart.animationKey, isActive && Boolean(chart.endpoint));
  const clipWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, chart.endpoint?.x ?? 0],
  });
  const markerOpacity = progress.interpolate({
    inputRange: [0, Ui.endpointRevealStart, 1],
    outputRange: [0, 0, 1],
  });
  const colors = getExpenseComparisonColors();
  const [width, setWidth] = useState(0);
  const height =
    width > 0
      ? Math.min(Ui.height, Math.max(Ui.minimumHeight, width * Ui.heightToWidthRatio))
      : Ui.height;
  const endpointDiameter = Ui.endpointRadius * 2;
  const hasRoomForEndpoint = width > endpointDiameter;
  // Keep at least one physical radius between either endpoint and the SVG edge.
  const viewBoxWidth = hasRoomForEndpoint
    ? Math.max(Ui.width, ((Ui.width - Ui.inset * 2) * width) / (width - endpointDiameter))
    : Ui.width;
  const viewBoxLeft = (Ui.width - viewBoxWidth) / 2;

  return (
    <Svg
      width="100%"
      height={height}
      viewBox={`${viewBoxLeft} 0 ${viewBoxWidth} ${Ui.height}`}
      preserveAspectRatio="none"
      accessible={false}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <Defs>
        <ClipPath id={clipId}>
          <AnimatedRect x={0} y={0} width={clipWidth} height={Ui.height} />
        </ClipPath>
        <LinearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={colors.previous} stopOpacity={Ui.previousOpacity} />
          <Stop offset="100%" stopColor={colors.previous} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={chart.previous.area} fill={`url(#${gradientId})`} />
      <Path
        d={chart.previous.line}
        fill="none"
        stroke={colors.previous}
        strokeWidth={Ui.lineWidth}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
      />
      <G clipPath={`url(#${clipId})`}>
        <Path
          d={chart.current.line}
          fill="none"
          stroke={currentColor}
          strokeWidth={Ui.lineWidth}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
        />
      </G>
      {chart.endpoint && hasRoomForEndpoint ? (
        <AnimatedGroup opacity={markerOpacity}>
          <Ellipse
            cx={chart.endpoint.x}
            cy={chart.endpoint.y}
            rx={(Ui.endpointRadius * viewBoxWidth) / width}
            ry={(Ui.endpointRadius * Ui.height) / height}
            fill={currentColor}
          />
        </AnimatedGroup>
      ) : null}
    </Svg>
  );
}
