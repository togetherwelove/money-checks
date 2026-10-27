const assert = require('node:assert/strict');
const test = require('node:test');
const { modules, hooks } = require('./annualReportHelpers.cjs');

function setup(os = 'ios') {
  const h = hooks(), alerts = [];
  const jsx = (type, props) => ({ type, props });
  const load = modules({
    react: { ...h.react, useMemo: factory => factory() },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { Platform: { OS: os }, Alert: { alert: (...args) => alerts.push(args) },
      View: 'View', Text: 'Text', Pressable: 'Pressable', ScrollView: 'ScrollView',
      StyleSheet: { create: value => value } },
    'react-native-safe-area-context': { SafeAreaProvider: 'SafeAreaProvider', SafeAreaView: 'SafeAreaView' },
    'react-native-root-siblings': { RootSiblingParent: 'ToastHost' },
    '@expo/vector-icons': { Feather: 'Feather' },
    'src/components/ComposerBlockingModal.tsx': { ComposerBlockingModal: 'Modal' },
    'src/components/ModalCloseButton.tsx': { ModalCloseButton: 'Close' },
    'src/components/entryComposer/EntryComposerHeader.tsx': { EntryComposerHeader: 'Header' },
    'src/components/ActionButton.tsx': { ActionButton: 'ActionButton' },
    'src/components/IconActionButton.tsx': { IconActionButton: 'IconActionButton' },
    'src/constants/subscription.ts': {
      SubscriptionTiers: { free: 'free', plus: 'plus' },
      SubscriptionConfig: { freeAccessibleLedgerBookLimit: 1, plusAccessibleLedgerBookLimit: 3 },
    },
  });
  return { h, load, alerts };
}

function nodes(node) {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node?.props) return [];
  return [node, ...nodes(node.props.children)];
}

test('subscription warning only runs the selected action and keeps cancellation safe', () => {
  const { load, alerts } = setup();
  const { showDeleteSubscriptionWarning } = load('src/components/accountScreen/showDeleteSubscriptionWarning.ts');
  const events = [];
  showDeleteSubscriptionWarning(() => events.push('manage'), () => events.push('continue'));
  const [, message, buttons, options] = alerts[0];
  assert.ok(message.includes('자동으로 취소되지'));
  assert.equal(options.cancelable, true);
  assert.equal(buttons.find(button => button.style === 'cancel').onPress, undefined);
  assert.deepEqual(events, []);
  buttons.find(button => button.text === '구독 관리').onPress();
  assert.deepEqual(events, ['manage']);
  buttons.find(button => button.style === 'destructive').onPress();
  assert.deepEqual(events, ['manage', 'continue']);
});

test('ordinary sheets allow the native dismissal gesture and synchronize the close handler', () => {
  const { load } = setup();
  const { NativeSelectionSheet } = load('src/components/NativeSelectionSheet.tsx');
  let closed = 0;
  const tree = NativeSelectionSheet({ isOpen: true, onClose: () => closed++, title: 'Title', children: 'Content' });
  assert.equal(tree.type, 'Modal');
  assert.equal(tree.props.presentationStyle, 'formSheet');
  assert.equal(tree.props.allowSwipeDismissal, true);
  assert.notEqual(tree.props.transparent, true);
  assert.equal(nodes(tree).find(node => node.type === 'ToastHost').props.inactive, false);
  const hidden = NativeSelectionSheet({ isOpen: false, onClose() {}, title: 'Title', children: 'Content' });
  assert.equal(hidden.type, 'Modal');
  assert.equal(hidden.props.visible, false);
  assert.equal(nodes(hidden).find(node => node.type === 'ToastHost').props.inactive, true);
  tree.props.onRequestClose();
  assert.equal(closed, 1);
  nodes(tree).find(node => node.type === 'Header').props.onClose();
  assert.equal(closed, 2);
});

test('iOS retains the modal through dismissal and forwards completion only from the native event', () => {
  const { h, load } = setup();
  const { NativeSelectionSheet } = load('src/components/NativeSelectionSheet.tsx');
  let dismissed = 0, isOpen = true;
  const onDismiss = () => dismissed++;
  const render = () => h.render(() => NativeSelectionSheet({ isOpen, onClose() {}, onDismiss, title: 'Entry', children: 'Draft' }));
  render();
  isOpen = false;
  const closing = render();
  assert.equal(closing.type, 'Modal');
  assert.equal(closing.props.visible, false);
  assert.equal(dismissed, 0);
  closing.props.onDismiss();
  assert.equal(dismissed, 1);
});

test('Android releases the sheet transition after its modal is hidden without waiting for an iOS-only event', () => {
  const { h, load } = setup('android');
  const { NativeSelectionSheet } = load('src/components/NativeSelectionSheet.tsx');
  let dismissed = 0, isOpen = false;
  const onDismiss = () => dismissed++;
  const render = () => h.render(() => NativeSelectionSheet({ isOpen, onClose() {}, onDismiss, title: 'Entry', children: 'Draft' }));
  render(); assert.equal(dismissed, 0);
  isOpen = true; render(); assert.equal(dismissed, 0);
  isOpen = false; render(); assert.equal(dismissed, 1);
  render(); assert.equal(dismissed, 1);
});

test('saving prevents both native swipe dismissal and the close button', () => {
  const { load } = setup();
  const { NativeSelectionSheet } = load('src/components/NativeSelectionSheet.tsx');
  let closed = 0;
  const tree = NativeSelectionSheet({ isOpen: true, dismissible: false,
    onClose: () => closed++, title: 'Entry', children: 'Content' });
  assert.equal(tree.props.allowSwipeDismissal, false);
  tree.props.onRequestClose();
  const close = nodes(tree).find(node => node.type === 'Header');
  assert.equal(close.props.saving, true);
  close.props.onClose();
  assert.equal(closed, 0);
});

test('sheets intercept native swipe attempts without disabling the close request', () => {
  const { load } = setup();
  const { NativeSelectionSheet } = load('src/components/NativeSelectionSheet.tsx');
  let requested = 0;
  const tree = NativeSelectionSheet({ isOpen: true, title: 'Entry', requiresCloseConfirmation: true,
    onClose: () => requested++, children: 'Draft' });
  assert.equal(tree.props.allowSwipeDismissal, false);
  tree.props.onRequestClose();
  assert.equal(requested, 1);
  assert.equal(nodes(tree).find(node => node.type === 'Header').props.saving, false);
});

test('shared header preserves confirmation labels and rejects disabled or busy actions', () => {
  const { load } = setup();
  const { NativeSelectionSheet } = load('src/components/NativeSelectionSheet.tsx');
  let applied = 0, closed = 0;
  const render = action => NativeSelectionSheet({ isOpen: true, title: '필터',
    onClose: () => closed++, children: 'Content', action });
  const action = { label: '필터 적용', onPress: () => applied++ };
  const active = render(action);
  const header = nodes(active).find(node => node.type === 'Header');
  assert.equal(header.props.title, '필터');
  assert.equal(header.props.actionLabel, action.label);
  header.props.onAction();
  assert.equal(applied, 1);
  nodes(render({ ...action, disabled: true })).find(node => node.type === 'Header').props.onAction();
  const busy = render({ ...action, loading: true });
  assert.equal(busy.props.allowSwipeDismissal, false);
  busy.props.onRequestClose();
  const busyHeader = nodes(busy).find(node => node.type === 'Header');
  busyHeader.props.onClose(); busyHeader.props.onAction();
  assert.equal(applied, 1);
  assert.equal(closed, 0);
});

test('filter sheet changes remain draft until applied and dismissal does not apply', () => {
  const { h, load } = setup();
  const { AllEntriesFilterSheet } = load('src/components/allEntries/AllEntriesFilterSheet.tsx');
  const applied = []; let closed = 0;
  const props = { categories: [{ id: 'food', label: 'Food', type: 'expense', iconName: 'coffee' }],
    entryTypeFilter: 'expense', selectedCategoryIds: ['food'], onApply: (type, ids) => applied.push([type, [...ids]]), onClose: () => closed++,
  };
  const render = () => h.render(() => AllEntriesFilterSheet(props));
  let tree = render();
  tree.props.onClose();
  assert.equal(closed, 1);
  assert.deepEqual(applied, []);
  let all = nodes(tree);
  all.find(node => node.type === 'Pressable' && nodes(node).some(child => child.props.children === '초기화')).props.onPress();
  tree = render();
  assert.deepEqual(applied, []);
  all = nodes(tree);
  tree.props.action.onPress();
  assert.deepEqual(applied, [['all', []]]);
  assert.equal(closed, 2);
});
