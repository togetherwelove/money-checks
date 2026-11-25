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
function setup() {
  const h = hooks();
  const load = modules({
    react: {
      ...h.react,
      useLayoutEffect: h.react.useEffect,
      createContext: () => ({ Provider: "HeaderContext" }),
    },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": { Text: "Text", View: "View", StyleSheet: { create: (x) => x } },
    "src/components/ActionButton.tsx": { ActionButton: "Button" },
    "src/components/AppIcons.tsx": { Feather: "Icon" },
    "src/components/BlockingOverlay.tsx": { BlockingOverlay: "Busy" },
    "src/components/KeyboardAwareScrollView.tsx": { KeyboardAwareScrollView: "Scroll" },
    "src/components/NativeSelectionSheet.tsx": { NativeSelectionSheet: "Sheet" },
    "src/components/sharedLedgerPanel/sharedLedgerPanelStyles.ts": {
      getSharedLedgerPanelStyles: () => ({}),
    },
  });
  return {
    h,
    Component: load("src/components/sharedLedgerPanel/LedgerBookManagementAccess.tsx")
      .LedgerBookManagementAccess,
  };
}
test("management opens on demand, shows current content, locks busy dismissal and hands subscription off after native dismissal", () => {
  const { h, Component } = setup();
  let navigated = 0,
    bookId = "a",
    isBusy = false;
  const render = () =>
    h.render(() =>
      Component({
        isBusy,
        onOpenSubscription: () => navigated++,
        children: (onOpenSubscription) => jsx("Management", { bookId, onOpenSubscription }),
      }),
    );
  let tree = render();
  assert.equal(
    nodes(tree).some((n) => n.type === "Management"),
    false,
  );
  nodes(tree)
    .find((n) => n.type === "Button")
    .props.onPress();
  tree = render();
  assert.equal(nodes(tree).find((n) => n.type === "Sheet").props.isOpen, true);
  bookId = "b";
  isBusy = true;
  tree = render();
  let sheet = nodes(tree).find((n) => n.type === "Sheet");
  assert.equal(sheet.props.dismissible, false);
  assert.ok(nodes(tree).some((n) => n.type === "Busy"));
  assert.equal(nodes(tree).find((n) => n.type === "Management").props.bookId, "b");
  sheet.props.onClose();
  tree = render();
  assert.equal(nodes(tree).find((n) => n.type === "Sheet").props.isOpen, true);
  isBusy = false;
  tree = render();
  nodes(tree)
    .find((n) => n.type === "Management")
    .props.onOpenSubscription();
  tree = render();
  sheet = nodes(tree).find((n) => n.type === "Sheet");
  assert.equal(sheet.props.isOpen, false);
  assert.equal(navigated, 0);
  sheet.props.onDismiss();
  tree = render();
  assert.equal(navigated, 1);
  assert.equal(
    nodes(tree).some((n) => n.type === "Sheet"),
    false,
  );
  h.unmount();
});
test("existing management sheet renders inline without a second sheet or access button", () => {
  const { h, Component } = setup();
  const onOpenSubscription = () => {};
  const tree = h.render(() =>
    Component({
      inline: true,
      onOpenSubscription,
      children: (action) => jsx("Management", { action }),
    }),
  );
  assert.equal(tree.type, "Management");
  assert.equal(tree.props.action, onOpenSubscription);
  assert.equal(
    nodes(tree).some((n) => n.type === "Sheet" || n.type === "Button"),
    false,
  );
  h.unmount();
});
