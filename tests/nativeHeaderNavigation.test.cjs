const assert = require('node:assert/strict');
const test = require('node:test');
const { modules } = require('./annualReportHelpers.cjs');
const jsx = (type, props) => ({ type, props });

function navigator(onDismissKeyboard = () => {}, props = {}, os = 'ios') {
  const screens = ['Account', 'AllEntries', 'AppSettings', 'Chart', 'EntryNativeSheet', 'Help', 'HelpFaq',
    'Home', 'NotificationSettings', 'ShareLedger', 'Subscription', 'SupportContact', 'Support'];
  const overrides = Object.fromEntries(screens.map(name => [
    `src/screens/${name}Screen.tsx`, { [`${name}Screen`]: `${name}Screen` },
  ]));
  const load = modules({ ...overrides,
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { Platform: { OS: os }, View: 'View', Keyboard: { dismiss: onDismissKeyboard } },
    'src/components/IconActionButton.tsx': { IconActionButton: 'Action' },
    '@react-navigation/native-stack': { createNativeStackNavigator: () => ({ Navigator: 'Navigator', Screen: 'Screen' }) },
  });
  return load('src/app/SignedInStackNavigator.tsx').SignedInStackNavigator({
    renderScreenTitle: screen => `header:${screen}`, renderHeaderActions: () => 'menu',
    ledgerState: {}, ...props,
  });
}

test('every regular screen has one native header; primary tabs omit back and child screens retain it', () => {
  const tree = navigator();
  for (const screen of tree.props.children) {
    const name = screen.props.name;
    const options = tree.props.screenOptions({ route: { name } });
    if (name === 'entry-sheet') {
      assert.equal(options.headerShown, false);
      continue;
    }
    assert.equal(options.headerShown, true);
    assert.equal(options.headerTitleAlign, 'center');
    assert.equal(options.headerBackVisible, !['calendar', 'all-entries', 'charts'].includes(name));
    assert.equal(options.gestureEnabled, !['calendar', 'all-entries', 'charts'].includes(name));
    assert.equal(options.freezeOnBlur, false);
    assert.equal(options.fullScreenGestureEnabled, false);
    assert.equal(options.headerTitle(), `header:${name}`);
    assert.equal(options.headerRight(), 'menu');
  }
});

test('primary screens expose add as a native toolbar action with disabled and accessibility support', () => {
  let opened = 0;
  const tree = navigator(undefined, { onOpenEntry: () => opened++ });
  for (const name of ['calendar', 'all-entries', 'charts']) {
    const options = tree.props.screenOptions({ route: { name } });
    const items = options.unstable_headerRightItems();
    const add = items.find(item => item.type === 'button');
    assert.equal(add.icon.type, 'sfSymbol');
    assert.equal(add.icon.name, 'plus');
    assert.ok(add.accessibilityLabel);
    assert.equal(add.variant, 'prominent');
    add.onPress();
  }
  assert.equal(opened, 3);
  const blocked = navigator(undefined, { onOpenEntry: () => opened++, entryActionDisabled: true });
  const add = blocked.props.screenOptions({ route: { name: 'calendar' } }).unstable_headerRightItems().find(item => item.type === 'button');
  assert.equal(add.disabled, true);
  add.onPress();
  assert.equal(opened, 3);
  assert.equal(tree.props.screenOptions({ route: { name: 'help' } }).unstable_headerRightItems, undefined);
});

test('Android keeps add available in the primary header after removing the action tab', () => {
  let opened = 0;
  const tree = navigator(undefined, { onOpenEntry: () => opened++ }, 'android');
  const options = tree.props.screenOptions({ route: { name: 'calendar' } });
  const add = options.headerRight().props.children[1];
  assert.equal(add.type, 'Action');
  assert.equal(add.props.icon, 'plus');
  add.props.onPress(); assert.equal(opened, 1);
});

test('FAQ retains its route but no longer renders a second title in the content', () => {
  const faq = navigator().props.children.find(screen => screen.props.name === 'help-faq');
  assert.equal(faq.props.children().props.screenTitle, null);
});

test('book management is hosted by the header sheet instead of a separate stack screen', () => {
  assert.equal(navigator().props.children.some(screen => screen.props.name === 'share'), false);
});

test('footer destinations switch without stack animations while child screens and sheets retain theirs', () => {
  const tree = navigator();
  const options = name => tree.props.screenOptions({ route: { name } });
  for (const name of ['calendar', 'all-entries', 'charts']) {
    assert.equal(options(name).animation, 'none');
  }
  for (const name of ['help', 'help-faq', 'app-settings', 'share']) {
    assert.equal(options(name).animation, 'slide_from_right');
  }
  assert.equal(options('entry-sheet').animation, 'slide_from_bottom');
});

test('back transitions dismiss the keyboard without cancelling autofocus when opening a screen', () => {
  let dismissals = 0;
  const tree = navigator(() => dismissals++);
  tree.props.screenListeners.transitionStart({ data: { closing: false } });
  assert.equal(dismissals, 0);
  tree.props.screenListeners.transitionStart({ data: { closing: true } });
  assert.equal(dismissals, 1);
});

test('web footer separates add from the destination tabs and blocks all actions when disabled', () => {
  const load = modules({
    '@expo/vector-icons': { MaterialCommunityIcons: 'MaterialIcon' },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { View: 'View', StyleSheet: { create: x => x } },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ bottom: 34 }) },
    'src/components/AppFooterTabBar.tsx': { AppFooterTabBar: 'Tabs' },
    'src/components/IconActionButton.tsx': { IconActionButton: 'Add' },
  });
  const { AppBottomNavigation } = load('src/components/AppBottomNavigation.tsx');
  const selected = [];
  const props = { activeScreen: 'help-faq', badges: [], disabled: false, onSelect: x => selected.push(x) };
  const [wrapper, add] = AppBottomNavigation(props).props.children;
  const tabs = wrapper.props.children.props;
  assert.deepEqual(Array.from(tabs.tabs, x => x.targetScreen), ['calendar', 'all-entries', 'charts']);
  assert.equal(tabs.activeScreen, null);
  tabs.onSelectTab('charts');
  add.props.onPress();
  const blocked = AppBottomNavigation({ ...props, disabled: true }).props.children;
  blocked[0].props.children.props.onSelectTab('calendar');
  blocked[1].props.onPress();
  assert.deepEqual(selected, ['charts', 'entry']);
});
