import { ExpenseMountainLayout as Ui } from "../constants/monthlyInsightCharts";
import type { CumulativeExpenseDay, DailyExpenseComparison } from "../types/expenseComparison";

type ChartPoint = { x: number; y: number };

export function getExpenseComparisonThroughDate(comparison: DailyExpenseComparison, today: string) {
  const current = comparison.current.filter((day) => day.date <= today);
  const currentAmount = current.at(-1)?.amount ?? 0;
  const previousAmount = comparison.previous.at(-1)?.amount ?? 0;
  const difference = currentAmount - previousAmount;
  return {
    current,
    currentAmount,
    previousAmount,
    deltaAmount: Math.abs(difference),
    direction:
      difference === 0
        ? ("same" as const)
        : difference < 0
          ? ("decrease" as const)
          : ("increase" as const),
  };
}

export function buildExpenseComparisonChart(comparison: DailyExpenseComparison, today: string) {
  const { current, currentAmount, previousAmount } = getExpenseComparisonThroughDate(
    comparison,
    today,
  );
  const maximum = Math.max(currentAmount, previousAmount, 1);
  const dayCount = Math.max(comparison.current.length, comparison.previous.length, 2);
  const baseline = Ui.height - Ui.inset;
  const plotWidth = Ui.width - Ui.inset * 2;
  const plotHeight = Ui.height - Ui.inset * 2;
  const toPoints = (days: CumulativeExpenseDay[]) => {
    return days.map((day, index) => ({
      x: Ui.inset + (index / (dayCount - 1)) * plotWidth,
      y: baseline - (day.amount / maximum) * plotHeight,
    }));
  };
  const currentPoints = toPoints(current);
  const previousPoints = toPoints(comparison.previous);
  const alignCompletedEndpoint = (points: ChartPoint[]) => {
    const last = points.at(-1);
    const right = Ui.width - Ui.inset;
    if (last && last.x < right) points.push({ x: right, y: last.y });
  };
  if (current.length === comparison.current.length) alignCompletedEndpoint(currentPoints);
  alignCompletedEndpoint(previousPoints);

  return {
    animationKey: `${current[0]?.date}:${today}:${maximum}:${current.map((day) => day.amount).join(",")}`,
    current: buildArea(currentPoints, baseline),
    previous: buildArea(previousPoints, baseline),
    endpoint: currentPoints.at(-1),
    currentAmount,
    previousAmount,
    currentDayCount: current.length,
    lastCurrentDate: current.at(-1)?.date,
    dayCount,
    baseline,
  };
}

function buildArea(points: ChartPoint[], baseline: number) {
  const first = points[0];
  const last = points.at(-1);
  if (!first || !last) return { line: "", area: "" };

  let line = `M ${first.x} ${first.y}`;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const midpointX = (previous.x + current.x) / 2;
    line += ` C ${midpointX} ${previous.y}, ${midpointX} ${current.y}, ${current.x} ${current.y}`;
  }
  return { line, area: `${line} L ${last.x} ${baseline} L ${first.x} ${baseline} Z` };
}

export type ExpenseComparisonChart = ReturnType<typeof buildExpenseComparisonChart>;
