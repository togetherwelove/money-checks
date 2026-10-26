const assert = require('node:assert/strict');
const test = require('node:test');
const { modules, hooks, currencyMock } = require('./annualReportHelpers.cjs');

function mount(initial = 1) {
  let runtime = hooks();
  const jsx = (type, props) => ({ type, props });
  const load = modules({
    'src/components/NativePickerSheet.tsx': { NativePickerSheet: 'Sheet' },
    react: { useState: (...args) => runtime.react.useState(...args), useRef: (...args) => runtime.react.useRef(...args),
      useEffect: (...args) => runtime.react.useEffect(...args) },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    '@react-native-picker/picker': { Picker: Object.assign(() => {}, { Item: 'PickerItem' }) },
    'src/lib/currencyPreference.ts': currencyMock,
    'src/components/entryComposer/EntryComposerHeader.tsx': { EntryComposerHeader: 'Header' },
    'src/components/ModalCloseButton.tsx': { ModalCloseButton: 'Close' },
    'react-native': {
      Modal: 'Modal', View: 'View', Text: 'Text', TextInput: 'Input', Pressable: 'Pressable',
      KeyboardAvoidingView: 'KeyboardAvoidingView', Platform: { OS: 'ios' },
      Keyboard: { dismiss() {} }, StyleSheet: { create: value => value },
    },
  });
  const { InstallmentPickerModal } = load('src/components/InstallmentPickerModal.tsx');
  const changes = [], nodes = [];
  const props = { installmentMonths: initial, isOpen: true,
    onClose: () => { props.isOpen = false; },
    onSelectInstallmentMonths: value => { changes.push(value); props.installmentMonths = value; },
  };
  function visit(node) {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node?.props) return;
    nodes.push(node);
    visit(node.props.children);
    visit(node.props.header);
  }
  function render() {
    nodes.length = 0;
    const root = InstallmentPickerModal(props);
    if (root) visit(runtime.render(() => root.type(root.props)));
  }
  render();
  const find = type => nodes.find(node => node.type === type);
  return { changes, props, nodes, render, find,
    pick: value => { nodes.find(node => node.props.onValueChange).props.onValueChange(value); render(); },
    type: value => { find('Input').props.onChangeText(value); render(); },
    reopen: () => { render(); props.isOpen = true; render(); },
  };
}

test('custom months apply only on confirmation and invalid inputs never reach the draft', () => {
  const ui = mount();
  for (const text of ['', '0', '6', '100', '-7', '7.5', '7e0', 'abc']) {
    ui.type(text);
    assert.equal(ui.find('Header').props.actionDisabled, true, text);
    ui.find('Header').props.onAction();
    assert.equal(ui.props.isOpen, true);
    assert.deepEqual(ui.changes, []);
  }
  for (const text of ['7', '24', '25', '99']) {
    ui.type(text);
    assert.equal(ui.find('Header').props.actionDisabled, false);
  }
  assert.deepEqual(ui.changes, []);
  ui.find('Header').props.onAction();
  assert.deepEqual(ui.changes, [99]);
  assert.equal(ui.props.isOpen, false);
});

test('existing custom months reopen intact and dismissal discards unfinished input', () => {
  const ui = mount(12);
  assert.equal(ui.find('Input').props.value, '12');
  ui.type('18');
  ui.find('Sheet').props.onClose();
  assert.deepEqual(ui.changes, []);
  ui.render();
  assert.equal(ui.find('Sheet').props.isOpen, false);
  ui.reopen();
  assert.equal(ui.find('Input').props.value, '12');
  ui.find('Header').props.onAction();
  assert.deepEqual(ui.changes, [12]);
});

test('99-month entries preserve the total amount and span calendar years correctly', () => {
  const load = modules({ 'src/lib/currencyPreference.ts': currencyMock });
  const { buildLedgerEntriesFromDraft, MAX_INSTALLMENT_MONTHS } = load('src/lib/installments.ts');
  assert.equal(MAX_INSTALLMENT_MONTHS, 99);
  const entries = buildLedgerEntriesFromDraft({ date: '2026-01-31', amount: '10000', type: 'expense',
    content: 'Long installment', category: 'Other', categoryId: 'other', note: '',
    photoAttachments: [], targetMemberId: 'self', installmentMonths: 99 });
  assert.equal(entries.length, 99);
  assert.equal(entries.reduce((sum, entry) => sum + entry.amount, 0), 10000);
  assert.equal(entries[1].date, '2026-02-28');
  assert.equal(entries[98].date, '2034-03-31');
  assert.equal(entries[98].installmentOrder, 99);
});
