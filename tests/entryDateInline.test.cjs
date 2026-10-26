const assert = require('node:assert/strict');
const test = require('node:test');
const { modules, hooks } = require('./annualReportHelpers.cjs');
const jsx = (type, props) => ({ type, props });
const nodes = node => Array.isArray(node) ? node.flatMap(nodes) : node?.props ? [node, ...nodes(node.props.children)] : [];

test('inline calendar applies immediately without a heading or confirmation controls', () => {
  const h = hooks(), changes = [];
  let memo;
  const load = modules({
    react: { ...h.react, useMemo: factory => memo ??= factory() },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    '@expo/vector-icons': { Feather: 'Icon' },
    '@react-native-community/datetimepicker': { __esModule: true, default: 'NativeDate' },
    'react-native': { Keyboard: { dismiss() {} }, Pressable: 'Trigger', Text: 'Text', View: 'View',
      StyleSheet: { create: value => value } },
    'src/components/NativePickerSheet.tsx': { NativePickerSheet: 'Panel' },
    'src/components/EntryInlineDatePicker.tsx': { EntryInlineDatePicker: 'Calendar' },
    'src/components/ActionButton.tsx': { ActionButton: 'Confirm' },
  });
  const { EntryDateSelector } = load('src/components/EntryDateSelector.tsx');
  const render = () => nodes(h.render(() => EntryDateSelector({ compact: true, inline: true,
    selectedDate: '2026-10-25', onSelectDate: value => changes.push(value) })));
  let all = render();
  assert.equal(all[0].type, 'View');
  assert.equal(all[0].props.style[0].alignSelf, 'flex-start');
  all.find(n => n.type === 'Trigger').props.onPress();
  all = render();
  assert.equal(all[0].props.style[1].alignSelf, 'stretch');
  assert.equal(all.find(n => n.type === 'Panel').props.inline, true);
  assert.equal(all.find(n => n.type === 'Panel').props.isOpen, true);
  assert.equal(all.find(n => n.type === 'Panel').props.showHeader, false);
  assert.equal(all.some(n => n.type === 'Confirm'), false);
  all.find(n => n.type === 'Calendar').props.onChange(new Date(2026, 9, 28));
  all = render();
  assert.deepEqual(changes, ['2026-10-28']);
  all.find(n => n.type === 'Panel').props.onClose();
  all = render();
  all.find(n => n.type === 'Trigger').props.onPress();
  all = render();
  assert.equal(all.find(n => n.type === 'Calendar').props.value.getDate(), 25);
  all.find(n => n.type === 'Calendar').props.onChange(new Date(2026, 9, 29));
  all = render();
  assert.deepEqual(changes, ['2026-10-28', '2026-10-29']);
  all.find(n => n.type === 'Trigger').props.onPress();
  assert.equal(render().find(n => n.type === 'Panel').props.isOpen, false);
});

test('Android calendar embeds Compose date picker and preserves the calendar day across time zones', () => {
  const load = modules({
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { StyleSheet: { create: value => value } },
    '@expo/ui/jetpack-compose': { Host: 'Host', DateTimePicker: 'Calendar' },
  });
  const { EntryInlineDatePicker } = load('src/components/EntryInlineDatePicker.android.tsx');
  const changes = [];
  const tree = EntryInlineDatePicker({ value: new Date(2026, 9, 25), onChange: date => changes.push(date) });
  assert.equal(tree.type, 'Host');
  const picker = tree.props.children;
  assert.equal(picker.props.initialDate, '2026-10-25T00:00:00.000Z');
  picker.props.onDateSelected(new Date('2026-10-29T00:00:00.000Z'));
  assert.equal(changes[0].getFullYear(), 2026);
  assert.equal(changes[0].getMonth(), 9);
  assert.equal(changes[0].getDate(), 29);
});
