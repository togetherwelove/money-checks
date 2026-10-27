const assert = require('node:assert/strict');
const test = require('node:test');
const { modules } = require('./annualReportHelpers.cjs');

const jsx = (type, props) => ({ type, props });
const load = modules({
  react: { useRef: () => ({ current: null }) },
  '@expo/vector-icons': { Feather: 'Icon' },
  'react/jsx-runtime': { jsx, jsxs: jsx },
  'react-native': { Pressable: 'Pressable', View: 'View', Text: 'Text', TextInput: 'TextInput', StyleSheet: { create: value => value } },
  'src/components/CategorySelector.tsx': { CategorySelector: 'Categories' },
  'src/components/EntryDateSelector.tsx': { EntryDateSelector: 'DateSelector' },
  'src/components/entryComposer/EntryComposerDetails.tsx': { EntryComposerDetails: 'Details' },
});

const { EntryComposerForm } = load('src/components/entryComposer/EntryComposerForm.tsx');
const nodes = node => Array.isArray(node) ? node.flatMap(nodes) : node?.props ? [node, ...nodes(node.props.children)] : [];

test('each populated input has an X that only clears its own value and respects the input lock', () => {
  const changes = []; let edited = 0;
  const props = { composer: { draft: { type: 'expense', amount: '8500', content: 'Lunch', note: 'Memo' },
    update: (...args) => changes.push(args) }, disabled: false, onChangeText: () => edited++ };
  const buttons = nodes(EntryComposerForm(props)).filter(node => node.type === 'Pressable');
  assert.deepEqual(buttons.map(node => node.props.accessibilityLabel), ['금액 지우기', '내용 지우기', '메모 비우기']);
  buttons.forEach(button => button.props.onPress());
  assert.deepEqual(changes, [['amount', ''], ['content', ''], ['note', '']]);
  assert.equal(edited, 3);
  nodes(EntryComposerForm({ ...props, disabled: true })).filter(node => node.type === 'Pressable').forEach(button => {
    assert.equal(button.props.disabled, true); button.props.onPress();
  });
  assert.equal(changes.length, 3);
  assert.equal(nodes(EntryComposerForm({ composer: { draft: { amount: '', content: '', note: '', type: 'expense' } } })).some(node => node.type === 'Pressable'), false);
});

test('all fields and expanded details are available immediately and update the same draft', () => {
  const changes = [];
  let dismissed = 0;
  const composer = { draft: { type: 'expense', amount: '', content: '', note: '', categoryId: '' },
    update: (...args) => changes.push(args) };
  const props = { composer, bookId: 'book', disabled: false, editing: false, inputRef: { current: null },
    onChangeText: () => dismissed++ };
  const all = nodes(EntryComposerForm(props));
  const date = all.find(node => node.type === 'DateSelector');
  assert.equal(all.indexOf(date) < all.findIndex(node => node.type === 'TextInput'), true);
  assert.equal(date.props.inline, true);
  assert.equal(date.props.compact, true);
  const details = all.find(node => node.type === 'Details');
  assert.equal(details.props.showDate, false);
  const inputs = all.filter(node => node.type === 'TextInput');
  assert.equal(inputs.length, 3);
  inputs[0].props.onChangeText('1,234');
  inputs[1].props.onChangeText('Lunch');
  inputs[2].props.onChangeText('With friends');
  all.find(node => node.type === 'Categories').props.onSelectCategory({ id: 'food', label: 'Food' });
  assert.deepEqual(changes, [['amount', '1234'], ['content', 'Lunch'], ['note', 'With friends'], ['category', 'Food'], ['categoryId', 'food']]);
  assert.equal(dismissed, 3);
  assert.equal(all.find(node => node.type === 'Details').props.composer, composer);
  assert.equal(inputs[1].props.multiline, true);
  assert.equal(inputs[2].props.multiline, true);
  const locked = nodes(EntryComposerForm({ ...props, disabled: true })).filter(node => node.type === 'TextInput');
  locked.forEach(node => {
    assert.equal(node.props.editable, false);
    node.props.onChangeText('ignored');
  });
  assert.equal(changes.length, 5);
});

test('native input flow ends at content and leaves optional memo outside the focus sequence', () => {
  const changes = [], focused = [];
  const amountRef = { current: null };
  const props = { composer: { draft: { type: 'expense', amount: '8500', content: 'Lunch', note: '' },
    update: (...args) => changes.push(args) }, disabled: false, inputRef: amountRef };
  const inputs = nodes(EntryComposerForm(props)).filter(node => node.type === 'TextInput');
  const [amount, content, note] = inputs;
  assert.equal(amount.props.ref, amountRef);
  assert.equal(amount.props.keyboardType, 'decimal-pad');
  assert.equal(amount.props.inputAccessoryViewButtonLabel, '다음: 내용');
  assert.equal(amount.props.returnKeyType, 'next');
  assert.equal(amount.props.submitBehavior, 'submit');
  assert.equal(content.props.returnKeyType, 'done');
  assert.equal(content.props.submitBehavior, 'blurAndSubmit');
  content.props.ref.current = { focus: () => focused.push('content') };
  assert.equal(note.props.ref, undefined);
  amount.props.onSubmitEditing();
  content.props.onSubmitEditing();
  assert.deepEqual(focused, ['content']);
  assert.deepEqual(changes, []);
  assert.equal(note.props.multiline, true);
  assert.equal(note.props.submitBehavior, 'newline');
  const locked = nodes(EntryComposerForm({ ...props, disabled: true })).filter(node => node.type === 'TextInput');
  locked[1].props.ref.current = { focus: () => focused.push('blocked') };
  locked.forEach(input => input.props.onSubmitEditing());
  assert.deepEqual(focused, ['content']);
});
