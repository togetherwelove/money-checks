const assert = require('node:assert/strict');
const test = require('node:test');
const { modules, hooks } = require('./annualReportHelpers.cjs');
const jsx = (type, props) => ({ type, props });

function nodes(node) {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node?.props) return [];
  return [node, ...nodes(node.props.children)];
}

function withMemo(h) {
  return { ...h.react, useMemo(factory, deps) {
    const ref = h.react.useRef();
    if (!ref.current || deps.some((value, index) => value !== ref.current.deps[index])) {
      ref.current = { deps, value: factory() };
    }
    return ref.current.value;
  } };
}

test('picker sheet keeps keyboard-aware scrolling inside the native sheet', () => {
  const load = modules({
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { View: 'View', Text: 'Text', StyleSheet: { create: value => value } },
    'src/components/ModalCloseButton.tsx': { ModalCloseButton: 'Close' },
    'src/components/NativeSelectionSheet.tsx': { NativeSelectionSheet: 'Sheet' },
    'src/components/KeyboardAwareScrollView.tsx': { KeyboardAwareScrollView: 'Scroll' },
  });
  const { NativePickerSheet } = load('src/components/NativePickerSheet.tsx');
  const close = () => {};
  const props = { isOpen: true, onClose: close, title: 'Picker', children: 'Content', header: 'CustomHeader' };
  const tree = NativePickerSheet(props);
  assert.equal(tree.type, 'Sheet');
  assert.equal(tree.props.onClose, close);
  assert.equal(tree.props.header, 'CustomHeader');
  assert.equal(tree.props.children.type, 'Scroll');
  assert.equal(tree.props.children.props.scrollEnabled, true);
  assert.equal(tree.props.children.props.children, 'Content');
  const closed = NativePickerSheet({ ...props, isOpen: false });
  assert.equal(closed.type, 'Sheet');
  assert.equal(closed.props.isOpen, false);
  assert.equal(NativePickerSheet({ ...props, isOpen: false, inline: true }), null);
  const inline = NativePickerSheet({ ...props, inline: true });
  assert.equal(inline.type, 'View');
  assert.equal(nodes(inline).some(node => node.type === 'Sheet' || node.type === 'Scroll'), false);
  assert.equal(inline.props.children[1], 'Content');
  assert.equal(nodes(inline).find(node => node.type === 'Close').props.onPress, close);
  const calendar = NativePickerSheet({ ...props, inline: true, showHeader: false });
  assert.equal(nodes(calendar).some(node => node.type === 'Close' || node.type === 'Text'), false);
});

test('summary day keeps 31 wheel values, applies only on confirmation and resets after cancellation', () => {
  const h = hooks();
  const load = modules({
    react: h.react,
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { View: 'View', StyleSheet: { create: value => value } },
    '@react-native-picker/picker': { Picker: Object.assign(() => {}, { Item: 'Item' }) },
    'src/components/NativePickerSheet.tsx': { NativePickerSheet: 'Sheet' },
    'src/components/ActionButton.tsx': { ActionButton: 'Button' },
  });
  const { CalendarSummaryBaseDayPickerModal } = load('src/components/appSettings/CalendarSummaryBaseDayPickerModal.tsx');
  const selected = [];
  const props = { baseDay: 15, isOpen: true, onClose: () => { props.isOpen = false; }, onSelect: day => selected.push(day) };
  const render = () => h.render(() => CalendarSummaryBaseDayPickerModal(props));
  let tree = render();
  assert.equal(tree.type, 'Sheet');
  assert.equal(nodes(tree).filter(node => node.type === 'Item').length, 31);
  nodes(tree).find(node => node.props.onValueChange).props.onValueChange(31);
  tree = render();
  assert.deepEqual(selected, []);
  tree.props.onClose();
  render();
  props.isOpen = true;
  tree = render();
  assert.equal(nodes(tree).find(node => node.props.onValueChange).props.selectedValue, 15);
  nodes(tree).find(node => node.props.onValueChange).props.onValueChange(1);
  tree = render();
  tree.props.action.onPress();
  assert.deepEqual(selected, [1]);
});

test('report range confirmation moves to the header and uses the current draft dates', () => {
  const h = hooks(), applied = [];
  const load = modules({
    react: withMemo(h),
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { View: 'View', Text: 'Text', Pressable: 'Pressable', StyleSheet: { create: value => value } },
    '@react-native-community/datetimepicker': 'DatePicker',
    'src/components/NativePickerSheet.tsx': { NativePickerSheet: 'Sheet' },
    'src/components/annualReport/AnnualReportPeriodOptions.tsx': { AnnualReportPeriodOptions: 'Options' },
  });
  const { AnnualReportRangePickerModal } = load('src/components/annualReport/AnnualReportRangePickerModal.tsx');
  const props = { selectedYear: null, isOpen: true, startDate: '2026-01-01', endDate: '2026-02-01',
    onConfirm: (...dates) => applied.push(dates), onClose() {} };
  const render = extra => h.render(() => AnnualReportRangePickerModal({ ...props, ...extra }));
  let tree = render();
  nodes(tree).find(node => node.type === 'DatePicker').props.onChange(null, new Date(2026, 0, 3));
  tree = render();
  assert.deepEqual(applied, []);
  tree.props.action.onPress();
  assert.deepEqual(applied, [['2026-01-03', '2026-02-01']]);
  assert.equal(render({ disabled: true }).props.action.disabled, true);
  assert.equal(render({ selectedYear: 2026 }).props.action, undefined);
});

test('standalone date selection confirms from the header and cancellation leaves the date unchanged', () => {
  const h = hooks(), selected = [];
  const load = modules({
    react: withMemo(h),
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { View: 'View', Text: 'Text', Pressable: 'Pressable', Keyboard: { dismiss() {} }, StyleSheet: { create: value => value } },
    '@expo/vector-icons': { Feather: 'Icon' },
    '@react-native-community/datetimepicker': 'DatePicker',
    'src/components/NativePickerSheet.tsx': { NativePickerSheet: 'Sheet' },
    'src/components/EntryInlineDatePicker.tsx': { EntryInlineDatePicker: 'Calendar' },
  });
  const { EntryDateSelector } = load('src/components/EntryDateSelector.tsx');
  const render = () => h.render(() => EntryDateSelector({ selectedDate: '2026-01-01', onSelectDate: date => selected.push(date) }));
  let tree = render();
  nodes(tree).find(node => node.type === 'Pressable').props.onPress();
  tree = render();
  nodes(tree).find(node => node.type === 'DatePicker').props.onChange(null, new Date(2026, 0, 4));
  tree = render();
  nodes(tree).find(node => node.type === 'Sheet').props.onClose();
  assert.deepEqual(selected, []);
  nodes(render()).find(node => node.type === 'Pressable').props.onPress();
  tree = render();
  nodes(tree).find(node => node.type === 'DatePicker').props.onChange(null, new Date(2026, 0, 5));
  tree = render();
  nodes(tree).find(node => node.type === 'Sheet').props.action.onPress();
  assert.deepEqual(selected, ['2026-01-05']);
  assert.equal(nodes(render()).find(node => node.type === 'Sheet').props.isOpen, false);
});
