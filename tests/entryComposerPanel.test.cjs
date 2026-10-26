const assert = require('node:assert/strict');
const test = require('node:test');
const { hooks, modules } = require('./annualReportHelpers.cjs');

function setup() {
  const harness = hooks();
  const jsx = (type, props) => ({ type, props });
  const load = modules({
    react: harness.react,
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { View: 'View', Text: 'Text', ActivityIndicator: 'ActivityIndicator',
      StyleSheet: { create: value => value, absoluteFill: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 } } },
    'src/components/ActionButton.tsx': { ActionButton: 'ActionButton' },
  });
  const { EntryComposerPanel } = load('src/components/entryComposer/EntryComposerPanel.tsx');
  const children = { type: 'draft', props: { value: '8500' } };
  const props = { children, disabled: false, saving: false, isAmountStep: true };
  return { props, children, render: () => harness.render(() => EntryComposerPanel(props)) };
}

const flatten = node => !node?.props ? [] : [node, ...[node.props.children].flat(Infinity).flatMap(flatten)];

test('loading uses one overlay and retains the same input content and its layout', () => {
  const panel = setup();
  const active = panel.render();
  panel.props.disabled = true;
  const loading = panel.render();
  assert.equal(active.props.children[0].props.children, loading.props.children[0].props.children);
  assert.equal(loading.props.children[0].props.pointerEvents, 'none');
  assert.equal(loading.props.children[0].props.importantForAccessibility, 'no-hide-descendants');
  assert.equal(flatten(loading).filter(node => node.type === 'ActivityIndicator').length, 1);
  assert.equal(loading.props.children[0].props.style.some(style => style?.opacity === 0), false);
  panel.props.disabled = false;
  assert.equal(panel.render().props.children[0].props.pointerEvents, 'auto');
});

test('no-book notice offers selection and preserves measured height when returning to ready', () => {
  const panel = setup();
  let selected = false;
  Object.assign(panel.props, { disabled: true, unavailableReason: 'no-book', onSelectBook: () => { selected = true; } });
  const blocked = panel.render();
  const nodes = flatten(blocked);
  nodes.find(node => node.type === 'ActionButton').props.onPress();
  assert.equal(selected, true);
  nodes.find(node => node.props.onLayout).props.onLayout({ nativeEvent: { layout: { height: 120 } } });
  const height = panel.render().props.style.find(style => style?.minHeight).minHeight;
  panel.props.disabled = false;
  assert.equal(panel.render().props.style.find(style => style?.minHeight).minHeight, height);
  panel.props.disabled = true;
  panel.props.unavailableReason = undefined;
  flatten(panel.render()).find(node => node.props.onLayout).props.onLayout({ nativeEvent: { layout: { height: 20 } } });
  assert.equal(panel.render().props.style.find(style => style?.minHeight).minHeight, height);
});

test('read-only has a single notice; saving keeps content visible and blocks interaction', () => {
  const panel = setup();
  Object.assign(panel.props, { disabled: true, unavailableReason: 'read-only' });
  const blocked = panel.render();
  assert.equal(flatten(blocked).filter(node => node.type === 'Text').length, 1);
  assert.equal(flatten(blocked).some(node => node.type === 'ActionButton'), false);
  assert.equal(blocked.props.children[0].props.style.some(style => style?.opacity === 0), true);
  panel.props.saving = true;
  const saving = panel.render();
  assert.equal(saving.props.children[1], null);
  assert.equal(saving.props.children[0].props.style.some(style => style?.opacity === 0), false);
  assert.equal(saving.props.children[0].props.pointerEvents, 'none');
  assert.equal(saving.props.accessibilityLabel, '저장 중…');
});
