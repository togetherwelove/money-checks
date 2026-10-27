const assert = require('node:assert/strict');
const test = require('node:test');
const { modules, hooks } = require('./annualReportHelpers.cjs');
const jsx = (type, props) => ({ type, props });

function mount(version = 26, os = 'ios', initialIcons = null, loadIcons = async () => null) {
  const state = hooks(), opened = [], heights = [];
  const load = modules({
    react: state.react, 'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { Platform: { OS: os, Version: version } },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ bottom: 34 }) },
    '@react-navigation/bottom-tabs/unstable': { createNativeBottomTabNavigator: () => ({ Navigator: 'NativeTabs', Screen: 'Tab' }) },
    'src/app/SignedInStackNavigator.tsx': { SignedInStackNavigator: 'Stack' },
    'src/app/NativeTabScene.tsx': { NativeTabScene: 'Scene' },
    'src/components/SessionLoadingScreen.tsx': { SessionLoadingScreen: 'Loading' },
    'src/lib/nativeBottomNavigationIcons.ts': {
      getCachedNativeBottomNavigationIcons: () => typeof initialIcons === 'function' ? initialIcons() : initialIcons,
      loadNativeBottomNavigationIcons: loadIcons,
    },
  });
  const { SignedInTabNavigator } = load('src/app/SignedInTabNavigator.native.tsx');
  const props = { disabled: false, badges: ['all-entries'], onOpenEntry: () => opened.push('entry'), onFooterHeightChange: height => heights.push(height) };
  return { render: extra => state.render(() => SignedInTabNavigator({ ...props, ...extra })), opened, heights, unmount: state.unmount };
}

test('the official native tabs own all five destination stacks and render them eagerly', () => {
  const ui = mount();
  const tree = ui.render();
  assert.equal(tree.type, 'NativeTabs');
  assert.equal(tree.props.initialRouteName, 'calendar-tab');
  assert.equal(tree.props.screenOptions.lazy, false);
  assert.equal(tree.props.screenOptions.headerShown, false);
  const tabs = tree.props.children;
  assert.deepEqual(Array.from(tabs, tab => tab.props.name), ['calendar-tab', 'entries-tab', 'charts-tab', 'books-tab', 'settings-tab']);
  assert.deepEqual(Array.from(tabs, tab => tab.props.children().props.children.props.initialScreen), ['calendar', 'all-entries', 'charts', 'share', 'app-settings']);
  assert.ok(tabs.every(tab => tab.props.children().type === 'Scene'));
  assert.ok(tabs.every(tab => tab.props.children().props.children.type === 'Stack'));
  assert.equal(tabs.length, 5);
  assert.ok(tabs.every(tab => tab.props.options.tabBarSelectionEnabled));
  assert.equal(tabs[1].props.options.tabBarBadge, ' ');
  const blocked = ui.render({ disabled: true });
  assert.ok(blocked.props.children.every(tab => !tab.props.options.tabBarSelectionEnabled));
  ui.unmount();
});

test('the first visible native tabs use final icon images without a symbol-to-image flash', async () => {
  let resolve;
  const pending = new Promise(done => { resolve = done; });
  const ui = mount(26, 'ios', () => undefined, () => pending);
  assert.equal(ui.render().type, 'Loading');
  resolve({ tabs: Array.from({ length: 5 }, (_, index) => ({ normal: { uri: `normal-${index}` }, selected: { uri: `selected-${index}` } })), add: { uri: 'add' } });
  await pending;
  const tree = ui.render();
  assert.equal(tree.type, 'NativeTabs');
  tree.props.children.forEach((tab, index) => {
    assert.equal(tab.props.options.tabBarIcon({ focused: false }).source.uri, `normal-${index}`);
    assert.equal(tab.props.options.tabBarIcon({ focused: true }).source.uri, `selected-${index}`);
  });
  ui.unmount();
});

test('icon generation shares pending work and cached assets across tab navigator mounts', async () => {
  let calls = 0;
  const load = modules({ '@expo/vector-icons': { MaterialCommunityIcons: {
    getImageSource: async name => { calls++; return { uri: name }; },
  } } });
  const icons = load('src/lib/nativeBottomNavigationIcons.ts');
  const first = icons.loadNativeBottomNavigationIcons();
  assert.equal(icons.loadNativeBottomNavigationIcons(), first);
  const assets = await first;
  assert.equal(calls, 10);
  assert.equal(icons.getCachedNativeBottomNavigationIcons(), assets);
  assert.equal(await icons.loadNativeBottomNavigationIcons(), assets);
});

test('book management refreshes when focused and releases its view when another tab opens', () => {
  const state = hooks();
  let focused = false, refreshed = 0;
  const load = modules({
    react: state.react, 'react/jsx-runtime': { jsx, jsxs: jsx },
    '@react-navigation/native': { useIsFocused: () => focused },
    'src/components/LedgerBookManagementView.tsx': { LedgerBookManagementView: 'Books' },
  });
  const { LedgerBooksScreen } = load('src/screens/LedgerBooksScreen.tsx');
  const props = { state: { activeBook: { id: 'a' }, refreshExpiredShareCode: () => refreshed++ } };
  const render = () => state.render(() => LedgerBooksScreen(props));
  assert.equal(render(), null);
  assert.equal(refreshed, 0);
  focused = true;
  assert.equal(render().type, 'Books');
  render(); assert.equal(refreshed, 1);
  props.state.activeBook = { id: 'b' };
  render(); assert.equal(refreshed, 2);
  focused = false;
  assert.equal(render(), null);
  state.unmount();
});
