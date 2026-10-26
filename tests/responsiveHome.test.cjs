const assert = require('node:assert/strict');
const test = require('node:test');
const { modules, hooks } = require('./annualReportHelpers.cjs');
const { resolveHomeLayout, ResponsiveLayout } = modules()('src/constants/responsiveLayout.ts');

test('phone and narrow multitasking windows use a single column; wide windows use two', () => {
  for (const width of [320, 375, 390, 430, 540, ResponsiveLayout.splitViewMinWidth - 1]) {
    assert.equal(resolveHomeLayout(width, 800, 350, 120).split, false);
  }
  for (const width of [ResponsiveLayout.splitViewMinWidth, 768, 820, 1024, 1366]) {
    assert.equal(resolveHomeLayout(width, 600, 350, 120).split, true);
  }
});

test('short screens and tall input panels keep the transaction list reachable', () => {
  assert.equal(resolveHomeLayout(375, 800, 350, 120).scrollCalendarWithEntries, false);
  assert.equal(resolveHomeLayout(375, 520, 350, 120).scrollCalendarWithEntries, true);
  assert.equal(resolveHomeLayout(375, 800, 350, 400).scrollCalendarWithEntries, true);
  assert.equal(resolveHomeLayout(820, 320, 350, 120).scrollCalendarWithEntries, false);
});

test('resizing and keyboard-sized height changes preserve the calendar and list hierarchy', () => {
  const harness = hooks();
  let focused = true;
  const jsx = (type, props) => ({ type, props });
  const load = modules({
    react: { ...harness.react, useContext: () => 0 },
    '@react-navigation/native': { useIsFocused: () => focused },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { View: 'View', ScrollView: 'ScrollView', StyleSheet: { create: value => value } },
    'src/contexts/BottomContentInsetContext.ts': { BottomContentInsetContext: {} },
  });
  const { HomeAdaptiveLayout } = load('src/components/homeScreen/HomeAdaptiveLayout.tsx');
  const calendar = { type: 'Calendar', props: {} };
  const header = { type: 'Summary', props: {} };
  const transactions = { type: 'Transactions', props: {} };
  const render = () => harness.render(() => HomeAdaptiveLayout({ calendar, transactionHeader: header, renderTransactions: () => transactions }));
  const measure = (node, width, height) => node.props.onLayout({ nativeEvent: { layout: { width, height } } });
  let root = render();
  const parts = tree => {
    const outer = tree.props.children;
    const [pane, list] = outer.props.children;
    return { outer, pane, list, calendar: pane.props.children, header: list.props.children[0] };
  };
  measure(parts(root).calendar, 375, 350);
  measure(parts(root).header, 375, 100);
  for (const [width, height, compact, split] of [[375, 900, false, false], [375, 350, true, false], [1024, 350, false, true], [375, 900, false, false]]) {
    measure(root, width, height);
    root = render();
    const current = parts(root);
    assert.equal(current.outer.type, 'ScrollView');
    assert.equal(current.pane.type, 'ScrollView');
    assert.equal(current.calendar.props.children, calendar);
    assert.equal(current.header.props.children, header);
    assert.equal(current.list.props.children[1], transactions);
    assert.equal(current.outer.props.scrollEnabled, compact);
    assert.equal(current.pane.props.scrollEnabled, split);
    assert.equal(current.calendar.props.onTouchStart, undefined);
    // Repeated identical native measurements must converge without replacing either subtree.
    for (let count = 0; count < 5; count++) {
      measure(current.calendar, width, 350);
      measure(current.header, width, 100);
      root = render();
      assert.equal(parts(root).outer.props.scrollEnabled, compact);
    }
  }
});
