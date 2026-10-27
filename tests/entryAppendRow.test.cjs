const assert = require('node:assert/strict');
const test = require('node:test');
const { modules, currencyMock } = require('./annualReportHelpers.cjs');
const jsx = (type, props) => ({ type, props });
const nodes = node => Array.isArray(node) ? node.flatMap(nodes) : node?.props ? [node, ...nodes(node.props.children)] : [];
const load = modules({
  'react/jsx-runtime': { jsx, jsxs: jsx },
  'react-native': { Animated: { View: 'AnimatedView' }, Pressable: 'Pressable', Text: 'Text', View: 'View', ScrollView: 'Scroll', RefreshControl: 'Refresh', ActivityIndicator: 'Loading', StyleSheet: { create: x => x } },
  'src/components/AppIcons.tsx': { Feather: 'Icon' },
  'src/components/IconActionButton.tsx': { IconActionButton: 'Dismiss' },
  'src/hooks/useClipboardExpansionAnimation.ts': { useClipboardExpansionAnimation: () => 1 },
  'src/hooks/useEntryAppendScroll.ts': { useEntryAppendScroll: () => ({}) },
  'src/contexts/ExpenseTextColorContext.tsx': { useExpenseTextColor: () => ({ textStyle: { color: 'expense-preference' } }) },
  'src/lib/currencyPreference.ts': currencyMock,
  'src/components/LedgerEntryList.tsx': { LedgerEntryList: 'List' },
  'src/components/AppFooterContentInset.tsx': { AppFooterContentInset: 'Inset' },
  'src/components/ledgerEntryDeleteAlert.ts': { showLedgerEntryDeleteAlert() {} },
});
const { LedgerEntryAppendRow } = load('src/components/LedgerEntryAppendRow.tsx');
function render(extra = {}) {
  const calls = [];
  const tree = LedgerEntryAppendRow({ selectedDate: '2026-10-27', disabled: false, clipboardDraft: null,
    onAdd: () => calls.push('add'), onApplyClipboard: () => calls.push('review'), onDismissClipboard: () => calls.push('dismiss'), ...extra });
  return { tree, calls, action: nodes(tree).find(n => n.type === 'Pressable') };
}
test('the next-entry row opens the composer and identifies the selected date', () => {
  const ui = render();
  assert.match(ui.action.props.accessibilityLabel, /2026/);
  assert.equal(nodes(ui.tree).find(n => n.type === 'Icon').props.name, 'plus');
  assert.deepEqual(ui.calls, []);
  ui.action.props.onPress();
  assert.deepEqual(ui.calls, ['add']);
});
test('clipboard preview remains unsaved and delegates review and dismissal independently', () => {
  const ui = render({ clipboardDraft: { amount: '8500', content: 'Coffee', date: '2026-10-26', type: 'expense' } });
  assert.match(ui.action.props.accessibilityLabel, /Coffee/);
  assert.match(ui.action.props.accessibilityLabel, /8,500/);
  assert.deepEqual(ui.calls, []);
  assert.ok(nodes(ui.tree).some(n => n.props.style?.some?.(style => style?.color === 'expense-preference')));
  ui.action.props.onPress();
  nodes(ui.tree).find(n => n.type === 'Dismiss').props.onPress();
  assert.deepEqual(ui.calls, ['review', 'dismiss']);
});
test('loading and unavailable ledger states block entry creation', () => {
  for (const unavailableReason of [undefined, 'no-book', 'read-only']) {
    const ui = render({ disabled: true, unavailableReason });
    assert.equal(ui.action.props.disabled, true);
    ui.action.props.onPress();
    assert.deepEqual(ui.calls, []);
  }
});
test('the append row follows existing entries and precedes the footer safe area, including an empty list', () => {
  const { HomeTransactionList } = load('src/components/homeScreen/HomeTransactionList.tsx');
  const append = jsx('Append', {});
  for (const entries of [[], [{ id: 'entry' }]]) {
    const tree = HomeTransactionList({ entries, entryAppend: append, isLoading: false });
    assert.equal(tree.props.refreshControl, undefined);
    assert.equal(tree.props.bounces, false);
    assert.equal(tree.props.children[0].type, 'List');
    assert.equal(tree.props.children[1], append);
    assert.equal(tree.props.children[2].type, 'Inset');
  }
});
