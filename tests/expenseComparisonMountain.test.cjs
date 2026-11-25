const assert = require("node:assert/strict");
const test = require("node:test");
const { modules, currencyMock, hooks } = require("./annualReportHelpers.cjs");
const jsx = (type, props) => ({ type, props });

test("comparison shows only the graphic and gates animation by screen and page visibility", () => {
  const state = hooks();
  let focused = true;
  const load = modules({
    react: state.react,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "@react-navigation/native": { useIsFocused: () => focused },
    "react-native": { View: "View", Text: "Text", StyleSheet: { create: (value) => value } },
    "src/components/monthlyInsights/ExpenseComparisonGraphic.tsx": {
      ExpenseComparisonGraphic: "Graphic",
    },
    "src/lib/currencyPreference.ts": currencyMock,
  });
  const { ExpenseComparisonMountain } = load(
    "src/components/monthlyInsights/ExpenseComparisonMountain.tsx",
  );
  const comparison = {
    current: [
      { date: "2020-11-01", amount: 100 },
      { date: "2020-11-02", amount: 150 },
    ],
    previous: [
      { date: "2020-10-01", amount: 120 },
      { date: "2020-10-02", amount: 200 },
    ],
  };
  const render = (isActive = true) =>
    state.render(() => ExpenseComparisonMountain({ comparison, isActive }));
  const tree = render();
  const graphic = tree.props.children;
  assert.equal(graphic.type, "Graphic");
  assert.equal(graphic.props.chart.currentAmount, 150);
  assert.equal(graphic.props.isActive, true);
  assert.equal(render(false).props.children.props.isActive, false);
  focused = false;
  assert.equal(render().props.children.props.isActive, false);
  state.unmount();
});
