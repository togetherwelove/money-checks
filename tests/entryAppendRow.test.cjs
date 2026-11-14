const assert = require("node:assert/strict");
const test = require("node:test");
const { modules, currencyMock, hooks } = require("./annualReportHelpers.cjs");
const jsx = (type, props) => ({ type, props });
let isPullRefreshing = false;
let cancelledScrolls = 0;
const nodes = (node) =>
  Array.isArray(node)
    ? node.flatMap(nodes)
    : node?.props
      ? [node, ...nodes(node.props.children)]
      : [];
const load = modules({
  "react/jsx-runtime": { jsx, jsxs: jsx },
  "react-native": {
    Animated: { View: "AnimatedView" },
    Pressable: "Pressable",
    Text: "Text",
    View: "View",
    ScrollView: "Scroll",
    RefreshControl: "Refresh",
    ActivityIndicator: "Loading",
    StyleSheet: { create: (x) => x },
  },
  "src/components/AppIcons.tsx": { Feather: "Icon" },
  "src/components/IconActionButton.tsx": { IconActionButton: "Dismiss" },
  "src/hooks/useClipboardExpansionAnimation.ts": { useClipboardExpansionAnimation: () => 1 },
  "src/hooks/useEntryAppendScroll.ts": {
    useEntryAppendScroll: () => ({
      cancelPendingScroll: () => {
        cancelledScrolls++;
      },
    }),
  },
  "src/hooks/usePullToRefresh.ts": {
    usePullToRefresh: (onRefresh) => ({ isPullRefreshing, onPullRefresh: onRefresh }),
  },
  "src/contexts/ExpenseTextColorContext.tsx": {
    useExpenseTextColor: () => ({ textStyle: { color: "expense-preference" } }),
  },
  "src/lib/currencyPreference.ts": currencyMock,
  "src/components/LedgerEntryList.tsx": { LedgerEntryList: "List" },
  "src/components/AppFooterContentInset.tsx": { AppFooterContentInset: "Inset" },
  "src/components/ledgerEntryDeleteAlert.ts": { showLedgerEntryDeleteAlert() {} },
});
const { LedgerEntryAppendRow } = load("src/components/LedgerEntryAppendRow.tsx");

test("home refresh does not insert a loading spacer into empty or populated lists", () => {
  const { HomeTransactionList } = load("src/components/homeScreen/HomeTransactionList.tsx");
  const append = jsx("Append", {});
  const renderList = (entries, isLoading) =>
    HomeTransactionList({
      entries,
      isLoading,
      entryAppend: append,
      onRefresh: async () => {},
    });
  assert.equal(nodes(renderList([], true)).filter((node) => node.type === "Loading").length, 1);
  try {
    for (const entries of [[], [{ id: "entry" }]]) {
      isPullRefreshing = false;
      const initial = renderList(entries, false);
      isPullRefreshing = true;
      const pulling = renderList(entries, true);
      assert.equal(pulling.props.refreshControl.props.refreshing, true);
      assert.equal(nodes(pulling).filter((node) => node.type === "Loading").length, 0);
      assert.equal(
        pulling.props.children[0]?.type ?? null,
        initial.props.children[0]?.type ?? null,
      );
      assert.strictEqual(pulling.props.children[1], initial.props.children[1]);
      isPullRefreshing = false;
      const completed = renderList(entries, false);
      assert.equal(
        completed.props.children[0]?.type ?? null,
        initial.props.children[0]?.type ?? null,
      );
    }
  } finally {
    isPullRefreshing = false;
  }
});

test("all entries suppresses its empty-list loader while the native pull indicator is active", () => {
  const h = hooks();
  let pulling = false;
  const entries = [],
    categories = [];
  const loadScreen = modules({
    react: { ...h.react, useDeferredValue: (value) => value },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": {
      View: "View",
      Text: "Text",
      Pressable: "Pressable",
      FlatList: "List",
      RefreshControl: "Refresh",
      ActivityIndicator: "Loading",
      StyleSheet: { create: (value) => value },
    },
    "src/hooks/usePullToRefresh.ts": {
      usePullToRefresh: () => ({ isPullRefreshing: pulling, onPullRefresh() {} }),
    },
    "src/hooks/useAllLedgerEntries.ts": {
      useAllLedgerEntries: () => ({ entries, isRefreshing: true, refreshEntries: async () => {} }),
    },
    "src/hooks/useLedgerCategories.ts": { useLedgerCategories: () => categories },
    "src/hooks/useLedgerCategoryIconMap.ts": { useLedgerCategoryIconMap: () => new Map() },
    "../hooks/useNativeAdCache": { useNativeAdCache: () => null },
    "../components/AppNativeAdCard": { AppNativeAdCard: "Ad" },
    "src/components/AppFooterContentInset.tsx": { AppFooterContentInset: "Inset" },
    "src/components/LedgerEntryListItem.tsx": { LedgerEntryListItem: "Item" },
    "src/components/allEntries/AllEntriesFilterBar.tsx": { AllEntriesFilterBar: "Filter" },
    "src/components/allEntries/AllEntriesFilterSheet.tsx": { AllEntriesFilterSheet: "FilterSheet" },
  });
  const { AllEntriesScreen } = loadScreen("src/screens/AllEntriesScreen.tsx");
  const renderList = () =>
    nodes(
      h.render(() =>
        AllEntriesScreen({
          activeBook: { id: "book" },
          showsNativeAds: false,
        }),
      ),
    ).find((node) => node.type === "List");
  const initialEmpty = renderList().props.ListEmptyComponent;
  assert.equal(nodes(initialEmpty).filter((node) => node.type === "Loading").length, 1);
  pulling = true;
  const list = renderList();
  assert.equal(list.props.refreshControl.props.refreshing, true);
  assert.equal(
    nodes(list.props.ListEmptyComponent).filter((node) => node.type === "Loading").length,
    0,
  );
  assert.equal(list.props.ListEmptyComponent.type, initialEmpty.type);
  assert.strictEqual(list.props.ListEmptyComponent.props.style, initialEmpty.props.style);
  h.unmount();
});
function render(extra = {}) {
  const calls = [];
  const tree = LedgerEntryAppendRow({
    selectedDate: "2026-10-27",
    disabled: false,
    clipboardDraft: null,
    onAdd: () => calls.push("add"),
    onApplyClipboard: () => calls.push("review"),
    onDismissClipboard: () => calls.push("dismiss"),
    ...extra,
  });
  return { tree, calls, action: nodes(tree).find((n) => n.type === "Pressable") };
}
test("the next-entry row opens the composer and identifies the selected date", () => {
  const ui = render();
  assert.match(ui.action.props.accessibilityLabel, /2026/);
  assert.equal(nodes(ui.tree).find((n) => n.type === "Icon").props.name, "plus");
  assert.deepEqual(ui.calls, []);
  ui.action.props.onPress();
  assert.deepEqual(ui.calls, ["add"]);
});
test("clipboard preview remains unsaved and delegates review and dismissal independently", () => {
  const ui = render({
    clipboardDraft: { amount: "8500", content: "Coffee", date: "2026-10-26", type: "expense" },
  });
  assert.match(ui.action.props.accessibilityLabel, /Coffee/);
  assert.match(ui.action.props.accessibilityLabel, /8,500/);
  assert.deepEqual(ui.calls, []);
  assert.ok(
    nodes(ui.tree).some((n) =>
      n.props.style?.some?.((style) => style?.color === "expense-preference"),
    ),
  );
  ui.action.props.onPress();
  nodes(ui.tree)
    .find((n) => n.type === "Dismiss")
    .props.onPress();
  assert.deepEqual(ui.calls, ["review", "dismiss"]);
});
test("loading and unavailable ledger states block entry creation", () => {
  for (const unavailableReason of [undefined, "no-book", "read-only"]) {
    const ui = render({ disabled: true, unavailableReason });
    assert.equal(ui.action.props.disabled, true);
    ui.action.props.onPress();
    assert.deepEqual(ui.calls, []);
  }
});
test("pull-to-refresh stays idle on render and preserves append placement and the refresh action", async () => {
  const { HomeTransactionList } = load("src/components/homeScreen/HomeTransactionList.tsx");
  const append = jsx("Append", {});
  let refreshCalls = 0;
  const onRefresh = async () => {
    refreshCalls++;
  };
  for (const entries of [[], [{ id: "entry" }]]) {
    const callsBeforeRender = refreshCalls;
    const tree = HomeTransactionList({
      entries,
      entryAppend: append,
      isLoading: false,
      onRefresh,
    });
    assert.equal(refreshCalls, callsBeforeRender);
    assert.equal(tree.props.refreshControl.type, "Refresh");
    assert.equal(tree.props.refreshControl.props.refreshing, false);
    assert.equal(tree.props.bounces, true);
    assert.equal(tree.props.alwaysBounceVertical, true);
    assert.equal(tree.props.children[0]?.type ?? null, entries.length ? "List" : null);
    assert.equal(tree.props.children[1], append);
    assert.equal(tree.props.children[2].type, "Inset");
    const cancellationsBeforePull = cancelledScrolls;
    await tree.props.refreshControl.props.onRefresh();
    assert.equal(cancelledScrolls, cancellationsBeforePull + 1);
    assert.equal(refreshCalls, callsBeforeRender + 1);
  }
});
