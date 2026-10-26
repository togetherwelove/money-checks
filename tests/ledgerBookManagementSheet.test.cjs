const assert = require('node:assert/strict');
const test = require('node:test');
const { modules, hooks } = require('./annualReportHelpers.cjs');
const jsx = (type, props) => ({ type, props });
const nodes = node => Array.isArray(node) ? node.flatMap(nodes)
  : node?.props ? [node, ...nodes(node.props.children)] : [];

test('one sheet exposes current-book management, refreshes on opening or switching, and blocks busy actions', () => {
  const h = hooks(); let refreshed = 0;
  const load = modules({
    react: h.react, 'react/jsx-runtime': { jsx, jsxs: jsx },
    'src/contexts/BottomContentInsetContext.ts': { BottomContentInsetContext: { Provider: 'Insets' } },
    'src/components/NativeSelectionSheet.tsx': { NativeSelectionSheet: 'Sheet' },
    'src/components/BlockingOverlay.tsx': { BlockingOverlay: 'Busy' },
    'src/components/LedgerBookManagementContent.tsx': { LedgerBookManagementContent: 'Management' },
  });
  const { LedgerBookManagementSheet } = load('src/components/LedgerBookManagementSheet.tsx');
  const state = { activeBook: { id: 'a' }, accessibleBooks: [], isBusy: false,
    refreshExpiredShareCode: async () => { refreshed++; }, switchLedgerBook: async () => true };
  const render = extra => h.render(() => LedgerBookManagementSheet({
    isOpen: true, state, onClose() {}, badgedBookIds: ['b'], ...extra,
  }));
  let tree = render();
  let content = nodes(tree).find(node => node.type === 'Management');
  assert.equal(content.props.activeBook, state.activeBook);
  assert.equal(content.props.onSwitchLedgerBook, state.switchLedgerBook);
  assert.deepEqual(content.props.badgedBookIds, ['b']);
  assert.equal(refreshed, 1);
  render({ state: { ...state, refreshExpiredShareCode: async () => { refreshed++; } } });
  assert.equal(refreshed, 1);
  tree = render({ state: { ...state, activeBook: { id: 'b' }, isBusy: true } });
  assert.equal(refreshed, 2);
  assert.equal(tree.props.dismissible, false);
  assert.ok(nodes(tree).some(node => node.type === 'Busy'));
  tree = render({ isOpen: false });
  assert.equal(tree.props.isOpen, false);
  assert.equal(nodes(tree).some(node => node.type === 'Management'), true);
  render();
  assert.equal(refreshed, 3);
  h.unmount();
});

test('book list retains unread badges and readonly switching; selecting the current book does nothing', async () => {
  const h = hooks(), selected = [], toasts = [];
  const load = modules({
    react: h.react, 'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { View: 'View', Text: 'Text', Pressable: 'Pressable', Alert: {} },
    'src/lib/appPlatform.ts': { appPlatform: { isIOS: true } },
    'src/constants/subscription.ts': {
      SubscriptionTiers: { free: 'free', plus: 'plus' },
      SubscriptionConfig: { freeOwnedLedgerBookLimit: 1, freeAccessibleLedgerBookLimit: 1 },
    },
    'src/lib/nativeToast.ts': { showNativeToast: text => toasts.push(text) },
    'src/lib/ledgerEditability.ts': { isLedgerBookEditableWithinPlanLimit: (_tier, _books, id) => id === 'a' },
    'src/components/IconActionButton.tsx': { IconActionButton: 'Icon' },
    'src/components/LedgerBookMembers.tsx': { LedgerBookMembers: 'Members' },
    'src/components/TextLinkButton.tsx': { TextLinkButton: 'Link' },
    'src/components/sharedLedgerPanel/sharedLedgerPanelStyles.ts': { sharedLedgerPanelStyles: {} },
  });
  const { LedgerBookManagementCard } = load('src/components/sharedLedgerPanel/LedgerBookManagementCard.tsx');
  const tree = h.render(() => LedgerBookManagementCard({
    activeBook: { id: 'a', ownerId: 'me' }, currentUserId: 'me', members: [],
    accessibleBooks: [{ id: 'a', name: 'A', ownerId: 'me' }, { id: 'b', name: 'B', ownerId: 'other' }],
    badgedBookIds: ['b'], pendingJoinRequestCountsByBookId: {}, subscriptionTier: 'free',
    onSwitchLedgerBook: async id => { selected.push(id); return false; },
  }));
  const rows = nodes(tree).filter(node => node.type === 'Pressable');
  rows[0].props.onPress();
  assert.deepEqual(selected, []);
  rows[1].props.onPress();
  await new Promise(setImmediate);
  assert.deepEqual(selected, ['b']);
  assert.equal(toasts.length, 1);
  assert.ok(nodes(rows[1]).some(node => node.props.children === '조회 전용'));
  assert.ok(nodes(rows[1]).some(node => node.props.accessible && node.props.accessibilityLabel));
  h.unmount();
});

test('switching books cannot apply an old member fetch or delayed realtime event to the new book', async () => {
  const h = hooks(), fetches = [], callbacks = [], removed = [], cache = new Map();
  let resolveName;
  const load = modules({
    react: h.react, 'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { View: 'View', StyleSheet: { create: value => value } },
    'src/components/KeyboardAwareScrollView.tsx': { KeyboardAwareScrollView: 'Scroll' },
    'src/components/AppFooterContentInset.tsx': { AppFooterContentInset: 'Inset' },
    'src/components/SharedLedgerPanel.tsx': { SharedLedgerPanel: 'Panel' },
    'src/lib/ledgerBookMembersCache.ts': {
      readCachedLedgerBookMembers: id => cache.get(id), writeCachedLedgerBookMembers: (id, value) => cache.set(id, value),
    },
    'src/lib/ledgerBooks.ts': { fetchLedgerBookMembers: id => new Promise(resolve => fetches.push({ id, resolve })) },
    'src/lib/ledgerEditability.ts': { isLedgerBookEditableWithinPlanLimit: () => true },
    'src/lib/profiles.ts': { fetchProfileDisplayName: () => new Promise(resolve => { resolveName = resolve; }) },
    'src/lib/supabase.ts': { supabase: {
      channel: () => { const channel = { on: (_event, _filter, callback) => { callbacks.push(callback); return channel; }, subscribe: () => channel }; return channel; },
      removeChannel: channel => removed.push(channel),
    } },
  });
  const { LedgerBookManagementContent } = load('src/components/LedgerBookManagementContent.tsx');
  const render = id => h.render(() => LedgerBookManagementContent({ activeBook: { id }, accessibleBooks: [] }));
  const members = tree => nodes(tree).find(node => node.type === 'Panel').props.members;
  render('a');
  fetches[0].resolve([{ userId: 'a-member' }]);
  await new Promise(setImmediate);
  assert.equal(members(render('a'))[0].userId, 'a-member');
  callbacks[0]({ eventType: 'UPDATE', new: { user_id: 'late-a', role: 'editor' } });
  assert.equal(members(render('b')).length, 0);
  resolveName('Late member');
  fetches[1].resolve([{ userId: 'b-member' }]);
  await new Promise(setImmediate);
  assert.deepEqual(Array.from(members(render('b')), item => item.userId), ['b-member']);
  render('c');
  render('d');
  fetches[2].resolve([{ userId: 'late-c' }]);
  fetches[3].resolve([{ userId: 'd-member' }]);
  await new Promise(setImmediate);
  assert.deepEqual(Array.from(members(render('d')), item => item.userId), ['d-member']);
  h.unmount();
  assert.equal(removed.length, 4);
});
