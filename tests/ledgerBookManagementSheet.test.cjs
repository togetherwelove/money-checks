const assert = require("node:assert/strict");
const test = require("node:test");
const { modules, hooks } = require("./annualReportHelpers.cjs");
const jsx = (type, props) => ({ type, props });
const nodes = (node) =>
  Array.isArray(node)
    ? node.flatMap(nodes)
    : node?.props
      ? [node, ...nodes(node.props.children)]
      : [];

test("one sheet exposes current-book management, refreshes on opening or switching, and blocks busy actions", () => {
  const h = hooks();
  let refreshed = 0;
  const load = modules({
    react: {
      ...h.react,
      createContext: () => ({ Provider: "HeaderContext" }),
      useContext: () => null,
    },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "src/contexts/BottomContentInsetContext.ts": {
      BottomContentInsetContext: { Provider: "Insets" },
    },
    "src/components/NativeSelectionSheet.tsx": { NativeSelectionSheet: "Sheet" },
    "src/components/BlockingOverlay.tsx": { BlockingOverlay: "Busy" },
    "src/components/LedgerBookManagementContent.tsx": { LedgerBookManagementContent: "Management" },
  });
  const { LedgerBookManagementSheet } = load("src/components/LedgerBookManagementSheet.tsx");
  const { LedgerBookManagementView } = load("src/components/LedgerBookManagementView.tsx");
  const state = {
    activeBook: { id: "a" },
    accessibleBooks: [],
    isBusy: false,
    refreshExpiredShareCode: async () => {
      refreshed++;
    },
    switchLedgerBook: async () => true,
  };
  const render = (extra) =>
    h.render(() =>
      LedgerBookManagementSheet({
        isOpen: true,
        state,
        onClose() {},
        badgedBookIds: ["b"],
        ...extra,
      }),
    );
  let tree = render();
  const view = nodes(tree).find((node) => node.type === LedgerBookManagementView);
  const content = LedgerBookManagementView(view.props);
  assert.equal(content.props.activeBook, state.activeBook);
  assert.equal(content.props.onSwitchLedgerBook, state.switchLedgerBook);
  assert.deepEqual(content.props.badgedBookIds, ["b"]);
  assert.equal(refreshed, 1);
  render({
    state: {
      ...state,
      refreshExpiredShareCode: async () => {
        refreshed++;
      },
    },
  });
  assert.equal(refreshed, 1);
  tree = render({ state: { ...state, activeBook: { id: "b" }, isBusy: true } });
  assert.equal(refreshed, 2);
  assert.equal(tree.props.dismissible, false);
  assert.ok(nodes(tree).some((node) => node.type === "Busy"));
  tree = render({ isOpen: false });
  assert.equal(tree.props.isOpen, false);
  assert.equal(
    nodes(tree).some((node) => node.type === LedgerBookManagementView),
    true,
  );
  render();
  assert.equal(refreshed, 3);
  h.unmount();
});

test("book list retains unread badges and readonly switching; selecting the current book does nothing", async () => {
  const h = hooks(),
    selected = [],
    toasts = [];
  const load = modules({
    react: {
      ...h.react,
      createContext: () => ({ Provider: "HeaderContext" }),
      useContext: () => null,
    },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": {
      View: "View",
      Text: "Text",
      Pressable: "Pressable",
      Alert: {},
      StyleSheet: { create: (value) => value },
    },
    "src/lib/appPlatform.ts": { appPlatform: { isIOS: true } },
    "src/constants/subscription.ts": {
      SubscriptionTiers: { free: "free", plus: "plus" },
      SubscriptionConfig: { freeOwnedLedgerBookLimit: 1, freeAccessibleLedgerBookLimit: 1 },
    },
    "src/lib/nativeToast.ts": { showNativeToast: (text) => toasts.push(text) },
    "src/lib/ledgerEditability.ts": {
      isLedgerBookEditableWithinPlanLimit: (_tier, _books, id) => id === "a",
    },
    "src/components/AppIcons.tsx": { Feather: "Feather" },
    "src/components/IconActionButton.tsx": { IconActionButton: "Icon" },
    "src/components/LedgerBookMembers.tsx": { LedgerBookMembers: "Members" },
    "src/components/TextLinkButton.tsx": { TextLinkButton: "Link" },
    "src/components/sharedLedgerPanel/sharedLedgerPanelStyles.ts": {
      getSharedLedgerPanelStyles: () => ({}),
    },
  });
  const { LedgerBookManagementCard } = load(
    "src/components/sharedLedgerPanel/LedgerBookManagementCard.tsx",
  );
  const tree = h.render(() =>
    LedgerBookManagementCard({
      activeBook: { id: "a", ownerId: "me" },
      currentUserId: "me",
      members: [],
      accessibleBooks: [
        { id: "a", name: "A", ownerId: "me" },
        { id: "b", name: "B", ownerId: "other" },
      ],
      badgedBookIds: ["b"],
      pendingJoinRequestCountsByBookId: {},
      subscriptionTier: "free",
      onSwitchLedgerBook: async (id) => {
        selected.push(id);
        return false;
      },
    }),
  );
  const { LedgerBookChoice } = load("src/components/sharedLedgerPanel/LedgerBookChoice.tsx");
  const choices = nodes(tree).filter((node) => node.type === LedgerBookChoice);
  assert.equal(choices.length, 2);
  const current = LedgerBookChoice(choices[0].props);
  assert.equal(current.type, "View");
  assert.equal(current.props.onPress, undefined);
  assert.equal(
    nodes(current).some((node) => node.props.name === "check"),
    false,
  );
  assert.deepEqual(selected, []);
  const other = LedgerBookChoice(choices[1].props);
  assert.equal(other.type, "Pressable");
  other.props.onPress();
  await new Promise(setImmediate);
  assert.deepEqual(selected, ["b"]);
  assert.equal(toasts.length, 1);
  const readOnlyLabel = load("src/constants/ledgerBookManagement.ts").LedgerBookManagementCopy
    .readOnlyBadge;
  assert.ok(nodes(other).some((node) => node.props.children === readOnlyLabel));
  assert.ok(nodes(other).some((node) => node.props.accessible && node.props.accessibilityLabel));
  assert.equal(
    nodes(other).some((node) => node.props.name === "chevron-right"),
    false,
  );
  const topLevel = tree.props.children.filter(Boolean);
  const memberIndex = topLevel.findIndex((node) =>
    nodes(node).some((child) => child.type === "Members"),
  );
  const otherIndex = topLevel.findIndex((node) => nodes(node).includes(choices[1]));
  assert.ok(memberIndex >= 0 && memberIndex < otherIndex);
  h.unmount();
});

test("switching books cannot apply an old member fetch or delayed realtime event to the new book", async () => {
  const h = hooks(),
    fetches = [],
    callbacks = [],
    removed = [],
    cache = new Map();
  let resolveName;
  const load = modules({
    react: {
      ...h.react,
      createContext: () => ({ Provider: "HeaderContext" }),
      useContext: () => null,
    },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": { View: "View", StyleSheet: { create: (value) => value } },
    "src/components/KeyboardAwareScrollView.tsx": { KeyboardAwareScrollView: "Scroll" },
    "src/components/AppFooterContentInset.tsx": { AppFooterContentInset: "Inset" },
    "src/components/SharedLedgerPanel.tsx": { SharedLedgerPanel: "Panel" },
    "src/lib/ledgerBookMembersCache.ts": {
      readCachedLedgerBookMembers: (id) => cache.get(id),
      writeCachedLedgerBookMembers: (id, value) => cache.set(id, value),
    },
    "src/lib/ledgerBooks.ts": {
      fetchLedgerBookMembers: (id) => new Promise((resolve) => fetches.push({ id, resolve })),
    },
    "src/lib/ledgerEditability.ts": { isLedgerBookEditableWithinPlanLimit: () => true },
    "src/lib/profiles.ts": {
      fetchProfileDisplayName: () =>
        new Promise((resolve) => {
          resolveName = resolve;
        }),
    },
    "src/lib/supabase.ts": {
      supabase: {
        channel: () => {
          const channel = {
            on: (_event, _filter, callback) => {
              callbacks.push(callback);
              return channel;
            },
            subscribe: () => channel,
          };
          return channel;
        },
        removeChannel: (channel) => removed.push(channel),
      },
    },
  });
  const { LedgerBookManagementContent } = load("src/components/LedgerBookManagementContent.tsx");
  const render = (id) =>
    h.render(() => LedgerBookManagementContent({ activeBook: { id }, accessibleBooks: [] }));
  const members = (tree) => nodes(tree).find((node) => node.type === "Panel").props.members;
  render("a");
  fetches[0].resolve([{ userId: "a-member" }]);
  await new Promise(setImmediate);
  assert.equal(members(render("a"))[0].userId, "a-member");
  callbacks[0]({ eventType: "UPDATE", new: { user_id: "late-a", role: "editor" } });
  assert.equal(members(render("b")).length, 0);
  resolveName("Late member");
  fetches[1].resolve([{ userId: "b-member" }]);
  await new Promise(setImmediate);
  assert.deepEqual(
    Array.from(members(render("b")), (item) => item.userId),
    ["b-member"],
  );
  render("c");
  render("d");
  fetches[2].resolve([{ userId: "late-c" }]);
  fetches[3].resolve([{ userId: "d-member" }]);
  await new Promise(setImmediate);
  assert.deepEqual(
    Array.from(members(render("d")), (item) => item.userId),
    ["d-member"],
  );
  h.unmount();
  assert.equal(removed.length, 4);
});

test("book-list name editing preserves failed input and closes only after a successful save", async () => {
  const h = hooks();
  let saved = false;
  const load = modules({
    react: {
      ...h.react,
      createContext: () => ({ Provider: "HeaderContext" }),
      useContext: () => null,
    },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": { View: "View", Text: "Text", TextInput: "Input" },
    "src/components/IconActionButton.tsx": { IconActionButton: "Edit" },
    "src/components/sharedLedgerPanel/sharedLedgerPanelStyles.ts": {
      getSharedLedgerPanelStyles: () => ({}),
    },
  });
  const { LedgerBookNameEditor } = load(
    "src/components/sharedLedgerPanel/LedgerBookNameEditor.tsx",
  );
  const props = {
    bookName: "Book",
    shareCode: "12345678",
    bookNameInput: "Book",
    canEditBookName: true,
    onChangeBookName: (value) => {
      props.bookNameInput = value;
    },
    onSaveBookName: async () => saved,
  };
  const render = () => nodes(h.render(() => LedgerBookNameEditor(props)));
  const { formatLedgerBookTitle } = load("src/lib/ledgerShareCode.ts");
  assert.ok(
    render().some((node) => node.props.children === formatLedgerBookTitle("Book", props.shareCode)),
  );

  render()
    .find((node) => node.type === "Edit")
    .props.onPress();
  assert.equal(render().find((node) => node.type === "Input").props.value, "Book");
  render()
    .find((node) => node.type === "Input")
    .props.onChangeText("Renamed");
  render()
    .find((node) => node.type === "Input")
    .props.onSubmitEditing();
  await Promise.resolve();
  assert.equal(render().find((node) => node.type === "Input").props.value, "Renamed");
  saved = true;
  render()
    .find((node) => node.type === "Input")
    .props.onSubmitEditing();
  await Promise.resolve();
  assert.equal(
    render().some((node) => node.type === "Input"),
    false,
  );
  props.canEditBookName = false;
  assert.equal(
    render().some((node) => node.type === "Edit"),
    false,
  );
  h.unmount();
});
