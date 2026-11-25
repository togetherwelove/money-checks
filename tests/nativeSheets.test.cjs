const assert = require("node:assert/strict");
const test = require("node:test");
const { modules, hooks } = require("./annualReportHelpers.cjs");

function setup(os = "ios") {
  const h = hooks(),
    alerts = [];
  const jsx = (type, props) => ({ type, props });
  const load = modules({
    react: { ...h.react, useMemo: (factory) => factory() },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": {
      Platform: { OS: os },
      Alert: { alert: (...args) => alerts.push(args) },
      View: "View",
      Text: "Text",
      Pressable: "Pressable",
      ScrollView: "ScrollView",
      StyleSheet: { create: (value) => value },
    },
    "react-native-safe-area-context": {
      SafeAreaProvider: "SafeAreaProvider",
      SafeAreaView: "SafeAreaView",
    },
    "react-native-root-siblings": { RootSiblingParent: "ToastHost" },
    "@expo/vector-icons": { Feather: "Feather" },
    "src/components/ComposerBlockingModal.tsx": { ComposerBlockingModal: "Modal" },
    "src/components/ModalCloseButton.tsx": { ModalCloseButton: "Close" },
    "src/components/entryComposer/EntryComposerHeader.tsx": { EntryComposerHeader: "Header" },
    "src/components/EntryInlineDatePicker.tsx": { EntryInlineDatePicker: "DatePicker" },
    "src/components/ActionButton.tsx": { ActionButton: "ActionButton" },
    "src/components/IconActionButton.tsx": { IconActionButton: "IconActionButton" },
    "src/constants/subscription.ts": {
      SubscriptionTiers: { free: "free", plus: "plus" },
      SubscriptionConfig: { freeAccessibleLedgerBookLimit: 1, plusAccessibleLedgerBookLimit: 3 },
    },
  });
  return { h, load, alerts };
}

function nodes(node) {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node?.props) return [];
  return [node, ...nodes(node.props.children), ...nodes(node.props.centerContent)];
}

test("subscription warning only runs the selected action and keeps cancellation safe", () => {
  const { load, alerts } = setup();
  const { showDeleteSubscriptionWarning } = load(
    "src/components/accountScreen/showDeleteSubscriptionWarning.ts",
  );
  const events = [];
  showDeleteSubscriptionWarning(
    () => events.push("manage"),
    () => events.push("continue"),
  );
  const [, message, buttons, options] = alerts[0];
  assert.ok(message.includes("자동으로 취소되지"));
  assert.equal(options.cancelable, true);
  assert.equal(buttons.find((button) => button.style === "cancel").onPress, undefined);
  assert.deepEqual(events, []);
  buttons.find((button) => button.text === "구독 관리").onPress();
  assert.deepEqual(events, ["manage"]);
  buttons.find((button) => button.style === "destructive").onPress();
  assert.deepEqual(events, ["manage", "continue"]);
});

test("ordinary sheets allow the native dismissal gesture and synchronize the close handler", () => {
  const { load } = setup();
  const { NativeSelectionSheet } = load("src/components/NativeSelectionSheet.tsx");
  let closed = 0;
  const tree = NativeSelectionSheet({
    isOpen: true,
    onClose: () => closed++,
    title: "Title",
    children: "Content",
  });
  assert.equal(tree.type, "Modal");
  assert.equal(tree.props.presentationStyle, "formSheet");
  assert.equal(tree.props.allowSwipeDismissal, true);
  assert.notEqual(tree.props.transparent, true);
  assert.equal(nodes(tree).find((node) => node.type === "ToastHost").props.inactive, false);
  const hidden = NativeSelectionSheet({
    isOpen: false,
    onClose() {},
    title: "Title",
    children: "Content",
  });
  assert.equal(hidden.type, "Modal");
  assert.equal(hidden.props.visible, false);
  assert.equal(nodes(hidden).find((node) => node.type === "ToastHost").props.inactive, true);
  tree.props.onRequestClose();
  assert.equal(closed, 1);
  nodes(tree)
    .find((node) => node.type === "Header")
    .props.onClose();
  assert.equal(closed, 2);
});

test("iOS retains the modal through dismissal and forwards completion only from the native event", () => {
  const { h, load } = setup();
  const { NativeSelectionSheet } = load("src/components/NativeSelectionSheet.tsx");
  let dismissed = 0,
    isOpen = true;
  const onDismiss = () => dismissed++;
  const render = () =>
    h.render(() =>
      NativeSelectionSheet({ isOpen, onClose() {}, onDismiss, title: "Entry", children: "Draft" }),
    );
  render();
  isOpen = false;
  const closing = render();
  assert.equal(closing.type, "Modal");
  assert.equal(closing.props.visible, false);
  assert.equal(dismissed, 0);
  closing.props.onDismiss();
  assert.equal(dismissed, 1);
});

test("Android releases the sheet transition after its modal is hidden without waiting for an iOS-only event", () => {
  const { h, load } = setup("android");
  const { NativeSelectionSheet } = load("src/components/NativeSelectionSheet.tsx");
  let dismissed = 0,
    isOpen = false;
  const onDismiss = () => dismissed++;
  const render = () =>
    h.render(() =>
      NativeSelectionSheet({ isOpen, onClose() {}, onDismiss, title: "Entry", children: "Draft" }),
    );
  render();
  assert.equal(dismissed, 0);
  isOpen = true;
  render();
  assert.equal(dismissed, 0);
  isOpen = false;
  render();
  assert.equal(dismissed, 1);
  render();
  assert.equal(dismissed, 1);
});

test("saving prevents both native swipe dismissal and the close button", () => {
  const { load } = setup();
  const { NativeSelectionSheet } = load("src/components/NativeSelectionSheet.tsx");
  let closed = 0;
  const tree = NativeSelectionSheet({
    isOpen: true,
    dismissible: false,
    onClose: () => closed++,
    title: "Entry",
    children: "Content",
  });
  assert.equal(tree.props.allowSwipeDismissal, false);
  tree.props.onRequestClose();
  const close = nodes(tree).find((node) => node.type === "Header");
  assert.equal(close.props.saving, true);
  close.props.onClose();
  assert.equal(closed, 0);
});

test("sheets intercept native swipe attempts without disabling the close request", () => {
  const { load } = setup();
  const { NativeSelectionSheet } = load("src/components/NativeSelectionSheet.tsx");
  let requested = 0;
  const tree = NativeSelectionSheet({
    isOpen: true,
    title: "Entry",
    requiresCloseConfirmation: true,
    onClose: () => requested++,
    children: "Draft",
  });
  assert.equal(tree.props.allowSwipeDismissal, false);
  tree.props.onRequestClose();
  assert.equal(requested, 1);
  assert.equal(nodes(tree).find((node) => node.type === "Header").props.saving, false);
});

test("shared header preserves confirmation labels and rejects disabled or busy actions", () => {
  const { load } = setup();
  const { NativeSelectionSheet } = load("src/components/NativeSelectionSheet.tsx");
  let applied = 0,
    closed = 0;
  const render = (action) =>
    NativeSelectionSheet({
      isOpen: true,
      title: "필터",
      onClose: () => closed++,
      children: "Content",
      action,
    });
  const action = { label: "필터 적용", onPress: () => applied++ };
  const active = render(action);
  const header = nodes(active).find((node) => node.type === "Header");
  assert.equal(header.props.title, "필터");
  assert.equal(header.props.actionLabel, action.label);
  header.props.onAction();
  assert.equal(applied, 1);
  nodes(render({ ...action, disabled: true }))
    .find((node) => node.type === "Header")
    .props.onAction();
  const busy = render({ ...action, loading: true });
  assert.equal(busy.props.allowSwipeDismissal, false);
  busy.props.onRequestClose();
  const busyHeader = nodes(busy).find((node) => node.type === "Header");
  busyHeader.props.onClose();
  busyHeader.props.onAction();
  assert.equal(applied, 1);
  assert.equal(closed, 0);
});

test("filter sheet has only its title, period and both category groups; category choices stay in the draft until apply", () => {
  const { h, load } = setup();
  const { AllEntriesFilterSheet } = load("src/components/allEntries/AllEntriesFilterSheet.tsx");
  const { AllEntriesCategoryGroup } = load("src/components/allEntries/AllEntriesCategoryGroup.tsx");
  const applied = [];
  const render = () =>
    h.render(() =>
      AllEntriesFilterSheet({
        categories: [
          { id: "food", label: "Food", type: "expense", iconName: "coffee" },
          { id: "salary", label: "Salary", type: "income", iconName: "briefcase" },
        ],
        selectedCategoryIds: ["food"],
        onClose() {},
        onApply: (type, ids) => applied.push([type, [...ids]]),
      }),
    );
  let tree = render();
  assert.equal(tree.props.centerContent, undefined);
  const groups = nodes(tree).filter((node) => node.type === AllEntriesCategoryGroup);
  assert.deepEqual(
    groups.map((node) => node.props.type),
    ["expense", "income"],
  );
  assert.equal(nodes(tree).filter((node) => node.type === "Pressable").length, 0);
  groups[1].props.onToggle("salary");
  tree = render();
  assert.equal(applied.length, 0);
  tree.props.action.onPress();
  assert.deepEqual(applied, [["all", ["food", "salary"]]]);
  const copy = load("src/constants/allEntries.ts").AllEntriesFilterCopy;
  const periodType = load(
    "src/components/allEntries/AllEntriesPeriodFilter.tsx",
  ).AllEntriesPeriodFilter;
  const reset = nodes(tree).find((node) => node.type === periodType).props.headingAction;
  assert.equal(reset.props.accessibilityLabel, copy.resetDraftAccessibilityLabel);
  reset.props.onPress();
  tree = render();
  tree.props.action.onPress();
  assert.deepEqual(applied[1], ["all", []]);
  h.unmount();
});

test("period edits stay in the filter draft until apply and reset clears the period", () => {
  const { h, load } = setup();
  const { AllEntriesFilterSheet } = load("src/components/allEntries/AllEntriesFilterSheet.tsx");
  const { AllEntriesPeriodFilter } = load("src/components/allEntries/AllEntriesPeriodFilter.tsx");
  const applied = [];
  const render = () =>
    h.render(() =>
      AllEntriesFilterSheet({
        categories: [],
        entryTypeFilter: "all",
        selectedCategoryIds: [],
        dateRange: null,
        onClose() {},
        onApply: (...args) => applied.push(args),
      }),
    );
  let tree = render();
  const range = { startDate: "2026-01-01", endDate: "2026-01-31" };
  nodes(tree)
    .find((n) => n.type === AllEntriesPeriodFilter)
    .props.onChange(range);
  tree = render();
  assert.equal(applied.length, 0);
  assert.equal(nodes(tree).find((n) => n.type === AllEntriesPeriodFilter).props.range, range);
  tree.props.action.onPress();
  assert.equal(applied[0][2], range);
  const copy = load("src/constants/allEntries.ts").AllEntriesFilterCopy;
  const reset = nodes(tree).find((n) => n.type === AllEntriesPeriodFilter).props.headingAction;
  assert.equal(reset.props.accessibilityLabel, copy.resetDraftAccessibilityLabel);
  reset.props.onPress();
  tree = render();
  tree.props.action.onPress();
  assert.equal(applied[1][2], null);
  h.unmount();
});

test("selection sheet places a custom selector in the header center while retaining close and apply", () => {
  const { load } = setup();
  const { NativeSelectionSheet } = load("src/components/NativeSelectionSheet.tsx");
  const center = { type: "Selector", props: {} };
  let applied = 0,
    closed = 0;
  const tree = NativeSelectionSheet({
    isOpen: true,
    title: "Filter",
    centerContent: center,
    children: null,
    onClose: () => closed++,
    action: { label: "Apply", onPress: () => applied++ },
  });
  const header = nodes(tree).find((node) => node.type === "Header");
  assert.equal(header.props.centerContent, center);
  header.props.onAction();
  header.props.onClose();
  assert.equal(applied, 1);
  assert.equal(closed, 1);
});
