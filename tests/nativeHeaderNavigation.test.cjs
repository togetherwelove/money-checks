const assert = require("node:assert/strict");
const test = require("node:test");
const { modules } = require("./annualReportHelpers.cjs");
const jsx = (type, props) => ({ type, props });

function navigator(onDismissKeyboard = () => {}, props = {}, os = "ios") {
  const screens = [
    "Account",
    "AllEntries",
    "AllMenu",
    "AppSettings",
    "Chart",
    "EntryNativeSheet",
    "Help",
    "HelpFaq",
    "Home",
    "NotificationSettings",
    "ShareLedger",
    "Subscription",
    "SupportContact",
    "Support",
  ];
  const overrides = Object.fromEntries(
    screens.map((name) => [
      `src/screens/${name}Screen.tsx`,
      { [`${name}Screen`]: `${name}Screen` },
    ]),
  );
  const load = modules({
    ...overrides,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": {
      Platform: { OS: os },
      View: "View",
      Keyboard: { dismiss: onDismissKeyboard },
    },
    "src/components/IconActionButton.tsx": { IconActionButton: "Action" },
    "@react-navigation/native-stack": {
      createNativeStackNavigator: () => ({ Navigator: "Navigator", Screen: "Screen" }),
    },
  });
  return load("src/app/SignedInStackNavigator.tsx").SignedInStackNavigator({
    renderScreenTitle: (screen) => `header:${screen}`,
    renderHeaderActions: () => "menu",
    ledgerState: {},
    ...props,
  });
}

test("every regular screen has one native header; primary tabs omit back and child screens retain it", () => {
  const tree = navigator();
  for (const screen of tree.props.children) {
    const name = screen.props.name;
    const options = tree.props.screenOptions({ route: { name } });
    if (name === "entry-sheet") {
      assert.equal(options.headerShown, false);
      continue;
    }
    assert.equal(options.headerShown, true);
    assert.equal(options.headerTitleAlign, "center");
    assert.equal(
      options.headerBackVisible,
      !["calendar", "all-entries", "charts", "all-menu"].includes(name),
    );
    assert.equal(
      options.gestureEnabled,
      !["calendar", "all-entries", "charts", "all-menu"].includes(name),
    );
    assert.equal(options.freezeOnBlur, false);
    assert.equal(options.fullScreenGestureEnabled, false);
    assert.equal(options.headerTitle(), `header:${name}`);
    assert.equal(options.headerRight, undefined);
  }
});

test("iOS and Android headers leave entry creation to the transaction list", () => {
  for (const os of ["ios", "android"]) {
    const tree = navigator(undefined, {}, os);
    for (const name of ["calendar", "all-entries", "charts", "all-menu"]) {
      const options = tree.props.screenOptions({ route: { name } });
      assert.equal(options.headerRight, undefined);
      assert.equal(options.unstable_headerRightItems, undefined);
    }
  }
});

test("FAQ retains its route but no longer renders a second title in the content", () => {
  const faq = navigator().props.children.find((screen) => screen.props.name === "help-faq");
  assert.equal(faq.props.children().props.screenTitle, null);
});

test("book sharing remains a child screen rendered by the shared management view", () => {
  const screen = navigator(undefined, { renderLedgerBooks: () => "books" }).props.children.find(
    (screen) => screen.props.name === "share",
  );
  assert.equal(screen.props.children(), "books");
});

test("footer destinations switch without stack animations while child screens and sheets retain theirs", () => {
  const tree = navigator();
  const options = (name) => tree.props.screenOptions({ route: { name } });
  for (const name of ["calendar", "all-entries", "charts", "all-menu"]) {
    assert.equal(options(name).animation, "none");
  }
  for (const name of ["help", "help-faq", "account", "subscription", "share"]) {
    assert.equal(options(name).animation, "slide_from_right");
  }
  assert.equal(options("entry-sheet").animation, "slide_from_bottom");
});

test("back transitions dismiss the keyboard without cancelling autofocus when opening a screen", () => {
  let dismissals = 0;
  const tree = navigator(() => dismissals++);
  tree.props.screenListeners.transitionStart({ data: { closing: false } });
  assert.equal(dismissals, 0);
  tree.props.screenListeners.transitionStart({ data: { closing: true } });
  assert.equal(dismissals, 1);
});

test("footer tabs contain only destinations and block navigation when disabled", () => {
  const load = modules({
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": {
      View: "View",
      StyleSheet: { create: (x) => x },
      useWindowDimensions: () => ({ fontScale: 1 }),
    },
    "react-native-safe-area-context": { useSafeAreaInsets: () => ({ bottom: 34 }) },
    "src/components/AppFooterTabBar.tsx": { AppFooterTabBar: "Tabs" },
  });
  const { AppBottomNavigation } = load("src/components/AppBottomNavigation.tsx");
  const selected = [];
  const props = {
    activeScreen: "help-faq",
    badges: [],
    disabled: false,
    onSelect: (x) => selected.push(x),
  };
  const wrapper = AppBottomNavigation(props).props.children;
  const tabs = wrapper.props.children.props;
  assert.deepEqual(
    Array.from(tabs.tabs, (x) => x.targetScreen),
    ["calendar", "all-entries", "charts", "all-menu"],
  );
  assert.equal(tabs.activeScreen, null);
  tabs.onSelectTab("charts");
  AppBottomNavigation({
    ...props,
    disabled: true,
  }).props.children.props.children.props.onSelectTab("calendar");
  assert.deepEqual(selected, ["charts"]);
});

test("all regular headers omit both menu and entry buttons", () => {
  const tree = navigator();
  for (const screen of tree.props.children) {
    const options = tree.props.screenOptions({ route: { name: screen.props.name } });
    assert.equal(options.headerRight, undefined);
    assert.equal(options.unstable_headerRightItems, undefined);
  }
});
