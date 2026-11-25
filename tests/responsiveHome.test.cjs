const assert = require("node:assert/strict");
const test = require("node:test");
const { modules, hooks } = require("./annualReportHelpers.cjs");

test("only the transaction list scrolls in single-column and two-column home layouts", () => {
  const harness = hooks();
  const jsx = (type, props) => ({ type, props });
  const load = modules({
    react: harness.react,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": {
      View: "View",
      ScrollView: "ScrollView",
      StyleSheet: { create: (value) => value },
    },
  });
  const { ResponsiveLayout } = load("src/constants/responsiveLayout.ts");
  const { HomeAdaptiveLayout } = load("src/components/homeScreen/HomeAdaptiveLayout.tsx");
  const calendar = { type: "Calendar", props: {} };
  const header = { type: "Summary", props: {} };
  const transactions = { type: "ScrollView", props: {} };
  const render = () =>
    harness.render(() =>
      HomeAdaptiveLayout({
        calendar,
        transactionHeader: header,
        renderTransactions: () => transactions,
      }),
    );
  let root = render();
  for (const [width, height, split] of [
    [320, 640, false],
    [375, 900, false],
    [375, 520, false],
    [ResponsiveLayout.splitViewMinWidth - 1, 520, false],
    [ResponsiveLayout.splitViewMinWidth, 600, true],
    [1024, 350, true],
    [375, 900, false],
  ]) {
    root.props.onLayout({ nativeEvent: { layout: { width, height } } });
    root = render();
    const [calendarPane, transactionPane] = root.props.children;
    const [headerPane, transactionList] = transactionPane.props.children;
    assert.equal(root.type, "View");
    assert.equal(root.props.style[1]?.flexDirection, split ? "row" : undefined);
    assert.equal(calendarPane.type, "View");
    assert.equal(calendarPane.props.children, calendar);
    assert.equal(transactionPane.type, "View");
    assert.equal(headerPane.type, "View");
    assert.equal(headerPane.props.children, header);
    assert.equal(transactionList, transactions);
  }
});
