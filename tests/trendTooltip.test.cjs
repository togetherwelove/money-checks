const assert = require("node:assert/strict");
const test = require("node:test");
const { modules, hooks, currencyMock } = require("./annualReportHelpers.cjs");

test("trend tooltip centers on the month and stays within resized plot edges", () => {
  const state = hooks();
  const jsx = (type, props) => ({ type, props });
  const { TrendChartTooltip } = modules({
    react: state.react,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": {
      Animated: {
        Value: class {},
        View: "AnimatedView",
        timing: () => ({ start() {}, stop() {} }),
      },
      StyleSheet: { create: (value) => value },
      Text: "Text",
      View: "View",
    },
    "src/lib/currencyPreference.ts": currencyMock,
  })("src/components/monthlyInsights/TrendChartTooltip.tsx");
  const onDismiss = () => {};
  let anchorX = 150,
    plotWidth = 300;
  const render = () =>
    state.render(() =>
      TrendChartTooltip({
        point: { monthLabel: "Aug", incomeAmount: 6020000, expenseAmount: 1000000 },
        anchorX,
        plotWidth,
        onDismiss,
      }),
    );
  render().props.onLayout({ nativeEvent: { layout: { width: 100 } } });
  assert.equal(render().props.style[1].left, 100);
  anchorX = 25;
  assert.equal(render().props.style[1].left, 0);
  anchorX = 275;
  assert.equal(render().props.style[1].left, 200);
  plotWidth = 80;
  assert.equal(render().props.style[1].left, 0);
  assert.equal(render().props.style[1].maxWidth, 80);
  state.unmount();
});
