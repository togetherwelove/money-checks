const assert = require("node:assert/strict");
const test = require("node:test");
const { modules, currencyMock } = require("./annualReportHelpers.cjs");
const jsx = (type, props) => ({ type, props });

test("last month is fully visible while only the current curve is clipped and its endpoint marks today", () => {
  let id = 0;
  const activations = [];
  const load = modules({
    react: { useId: () => `:${id++}:`, useState: () => [160, () => {}] },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": { Animated: { createAnimatedComponent: (type) => `Animated${type}` } },
    "react-native-svg": {
      __esModule: true,
      default: "Svg",
      Ellipse: "Ellipse",
      ClipPath: "Clip",
      Defs: "Defs",
      LinearGradient: "LinearGradient",
      Stop: "Stop",
      G: "Group",
      Path: "Path",
      Rect: "Rect",
    },
    "src/hooks/useExpenseChartReveal.ts": {
      useExpenseChartReveal: (key, active) => {
        activations.push([key, active]);
        return { interpolate: (config) => config };
      },
    },
    "src/lib/currencyPreference.ts": currencyMock,
  });
  const { ExpenseComparisonGraphic } = load(
    "src/components/monthlyInsights/ExpenseComparisonGraphic.tsx",
  );
  const { buildExpenseComparisonChart } = load("src/utils/expenseComparisonChart.ts");
  const { getExpenseComparisonColors } = load("src/constants/monthlyInsightCharts.ts");
  const colors = getExpenseComparisonColors();
  const chart = buildExpenseComparisonChart(
    {
      current: [
        { date: "2026-11-01", amount: 10 },
        { date: "2026-11-02", amount: 30 },
        { date: "2026-11-03", amount: 99 },
      ],
      previous: [
        { date: "2026-10-01", amount: 20 },
        { date: "2026-10-02", amount: 40 },
        { date: "2026-10-03", amount: 60 },
      ],
    },
    "2026-11-02",
  );
  const first = ExpenseComparisonGraphic({ chart, isActive: true });
  const [defs, previousArea, previousLine, currentGroup, marker] = first.props.children;
  const [clip, gradient] = defs.props.children;
  assert.equal(previousArea.props.d, chart.previous.area);
  assert.equal(previousArea.props.fill, `url(#${gradient.props.id})`);
  assert.equal(gradient.props.children[0].props.stopColor, colors.previous);
  assert.equal(gradient.props.children[1].props.stopOpacity, 0);
  assert.equal(previousArea.props.clipPath, undefined);
  assert.equal(previousLine.props.clipPath, undefined);
  assert.equal(previousLine.props.stroke, colors.previous);
  assert.equal(currentGroup.props.clipPath, `url(#${clip.props.id})`);
  assert.equal(currentGroup.props.children.type, "Path");
  assert.equal(currentGroup.props.children.props.d, chart.current.line);
  assert.equal(currentGroup.props.children.props.fill, "none");
  assert.equal(currentGroup.props.children.props.stroke, colors.current);
  assert.equal(currentGroup.props.children.props.strokeWidth, previousLine.props.strokeWidth);
  assert.equal(previousLine.props.vectorEffect, "non-scaling-stroke");
  assert.equal(currentGroup.props.children.props.vectorEffect, "non-scaling-stroke");
  assert.notEqual(colors.current, colors.previous);
  assert.deepEqual(Array.from(clip.props.children.props.width.outputRange), [0, chart.endpoint.x]);
  const dot = marker.props.children;
  assert.equal(dot.type, "Ellipse");
  assert.equal(dot.props.cx, chart.endpoint.x);
  assert.equal(dot.props.cy, chart.endpoint.y);
  const [left, , viewBoxWidth, viewBoxHeight] = first.props.viewBox.split(" ").map(Number);
  const layout = load("src/constants/monthlyInsightCharts.ts").ExpenseMountainLayout;
  assert.ok(first.props.height < layout.height);
  assert.ok(Math.abs((dot.props.rx * 160) / viewBoxWidth - layout.endpointRadius) < 1e-9);
  assert.ok(
    Math.abs((dot.props.ry * first.props.height) / viewBoxHeight - layout.endpointRadius) < 1e-9,
  );
  assert.ok(dot.props.ry <= layout.inset);
  const rightmostPoint = layout.width - layout.inset;
  assert.ok(rightmostPoint + dot.props.rx <= left + viewBoxWidth + 1e-9);
  assert.equal(dot.props.fill, colors.current);
  assert.deepEqual(Array.from(marker.props.opacity.outputRange), [0, 0, 1]);
  const second = ExpenseComparisonGraphic({ chart, isActive: false });
  assert.notEqual(second.props.children[0].props.children[0].props.id, clip.props.id);
  assert.deepEqual(
    activations.map((call) => call[1]),
    [true, false],
  );
});
