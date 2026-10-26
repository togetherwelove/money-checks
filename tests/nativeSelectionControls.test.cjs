const assert = require('node:assert/strict');
const test = require('node:test');
const { modules, currencyMock } = require('./annualReportHelpers.cjs');

function setup() {
  const jsx = (type, props) => ({ type, props });
  let dismissals = 0;
  const load = modules({
    react: { useMemo: factory => factory() },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    '@expo/vector-icons': { Feather: 'Feather' },
    '@react-native-menu/menu': { MenuView: 'MenuView' },
    'src/lib/currencyPreference.ts': currencyMock,
    'react-native': {
      View: 'View', Text: 'Text', Pressable: 'Pressable', TextInput: 'TextInput', Switch: 'Switch',
      Keyboard: { dismiss: () => dismissals++ }, StyleSheet: { create: value => value },
    },
  });
  return { load, dismissals: () => dismissals };
}

function find(node, type) {
  if (!node || typeof node !== 'object') return;
  if (node.type === type) return node;
  for (const child of [node.props?.children].flat()) {
    const match = find(child, type);
    if (match) return match;
  }
}

test('notification menu preserves selected period, amount and toggle and maps every period', () => {
  const ui = setup();
  const { NotificationThresholdField } = ui.load('src/components/accountScreen/NotificationThresholdField.tsx');
  const periods = ['day', 'week', 'month'];
  const options = ['Day', 'Week', 'Month'].map(label => ({ key: `expenseAmount${label}`, label }));
  for (const selected of options) {
    const changes = [];
    const onChangeValue = () => {};
    const onToggleEnabled = () => {};
    const tree = NotificationThresholdField({
      settings: { selectedKey: selected.key, periodOptions: options, amountValue: '12000', enabled: true },
      onChangePeriod: value => changes.push(value), onChangeValue, onToggleEnabled,
    });
    const menu = find(tree, 'MenuView');
    assert.equal(menu.props.actions.find(action => action.state === 'on').id, selected.key);
    assert.equal(find(tree, 'Pressable').props.accessibilityValue.text, selected.label);
    assert.equal(find(tree, 'TextInput').props.value, '12,000');
    assert.equal(find(tree, 'TextInput').props.onChangeText, onChangeValue);
    assert.equal(find(tree, 'Switch').props.value, true);
    assert.equal(find(tree, 'Switch').props.onValueChange, onToggleEnabled);
    menu.props.onOpenMenu();
    menu.props.onPressAction({ nativeEvent: { event: 'unknown' } });
    assert.deepEqual(changes, []);
    for (const option of options) menu.props.onPressAction({ nativeEvent: { event: option.key } });
    assert.deepEqual(changes, periods);
  }
  assert.equal(ui.dismissals(), options.length);
});

test('member menu uses member identity even with duplicate names and keeps selection', () => {
  const ui = setup();
  const { EntryTargetMemberSelector } = ui.load('src/components/EntryTargetMemberSelector.tsx');
  const members = [{ userId: 'first', displayName: 'Same' }, { userId: 'second', displayName: 'Same' }];
  const changes = [];
  const tree = EntryTargetMemberSelector({ members, selectedMemberId: 'second', onSelectMember: value => changes.push(value) });
  const menu = find(tree, 'MenuView');
  assert.equal(menu.props.actions.find(action => action.state === 'on').id, 'second');
  menu.props.onOpenMenu();
  menu.props.onPressAction({ nativeEvent: { event: 'removed-member' } });
  assert.deepEqual(changes, []);
  menu.props.onPressAction({ nativeEvent: { event: 'first' } });
  assert.equal(changes[0], members[0]);
  assert.equal(ui.dismissals(), 1);
});

test('missing or empty members never silently replace the selected member', () => {
  const { load } = setup();
  const { EntryTargetMemberSelector } = load('src/components/EntryTargetMemberSelector.tsx');
  const onSelectMember = () => assert.fail('must not auto-select');
  const tree = EntryTargetMemberSelector({ members: [{ userId: 'other', displayName: 'Other' }], selectedMemberId: 'missing', onSelectMember });
  assert.ok(find(tree, 'MenuView').props.actions.every(action => action.state === 'off'));
  assert.equal(EntryTargetMemberSelector({ members: [], selectedMemberId: 'missing', onSelectMember }), null);
});

test('payment menu selects presets immediately and opens a sheet only for custom input', () => {
  const ui = setup();
  const { EntryInstallmentSelector } = ui.load('src/components/EntryInstallmentSelector.tsx');
  const selected = [];
  let customRequests = 0;
  const tree = EntryInstallmentSelector({ installmentMonths: 3,
    onSelectInstallmentMonths: months => selected.push(months), onRequestCustom: () => customRequests++ });
  assert.equal(tree.type, 'MenuView');
  assert.deepEqual(Array.from(tree.props.actions, action => action.id), ['1', '2', '3', '4', '5', '6', 'custom']);
  assert.equal(tree.props.actions[2].state, 'on');
  tree.props.onPressAction({ nativeEvent: { event: '1' } });
  assert.deepEqual(selected, [1]);
  assert.equal(customRequests, 0);
  tree.props.onPressAction({ nativeEvent: { event: 'custom' } });
  assert.equal(customRequests, 1);
  tree.props.onPressAction({ nativeEvent: { event: 'unknown' } });
  assert.deepEqual(selected, [1]);
});
