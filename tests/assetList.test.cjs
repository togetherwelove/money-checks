const test = require("node:test");
const assert = require("node:assert/strict");
const { modules, hooks } = require("./annualReportHelpers.cjs");

const nodes = (node) =>
  Array.isArray(node)
    ? node.flatMap(nodes)
    : node?.props
      ? [node, ...nodes(node.props.children)]
      : [];

test("asset list puts shared assets first, sorts names across kinds and opens the selected asset", () => {
  const jsx = (type, props) => ({ type, props });
  const { AssetList } = modules({
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": { Pressable: "Button", Text: "Text", View: "View" },
    "src/components/AppIcons.tsx": { Feather: "Icon" },
    "src/constants/settingsGroupStyles.ts": {
      getSettingsGroupStyles: () => ({ card: "group", divider: "divider" }),
      SettingsGroupDesign: { iconSize: 22 },
    },
  })("src/components/assets/AssetList.tsx");
  const assets = [
    { id: "private", name: "A", kind: "cash", is_shared: false },
    { id: "shared-z", name: "Z", kind: "stock", is_shared: true },
    { id: "shared-b", name: "B", kind: "property", is_shared: true },
    { id: "deleted", name: "Deleted", kind: "stock", is_shared: true, deleted_on: "2026-01-01" },
  ];
  let selected;
  const tree = AssetList({
    portfolio: { assets, valuations: [] },
    onSelect: (asset) => {
      selected = asset;
    },
  });
  const cards = nodes(tree).filter((node) => node.type === "Button");
  assert.equal(tree.props.style, "group");
  assert.equal(nodes(tree).filter((node) => node.props.style === "divider").length, 2);
  assert.deepEqual(
    cards.map((card) => card.props.accessibilityLabel.split(" ")[0]),
    ["B", "Z", "A"],
  );
  assert.equal(cards.length, 3);
  assert.equal(
    nodes(tree).some((node) => node.props.accessibilityRole === "header"),
    false,
  );
  cards[0].props.onPress();
  assert.equal(selected.id, "shared-b");
});

test("the shared asset scope switches the total and owner list together", () => {
  const state = hooks();
  let loading = false;
  const jsx = (type, props) => ({ type, props });
  const portfolio = {
    assets: [
      { id: "cash", user_id: "me", kind: "cash", current_balance: 300 },
      { id: "loan", user_id: "me", kind: "loan", current_balance: 100 },
      { id: "shared", user_id: "other", kind: "cash", current_balance: 500, is_shared: true },
    ],
    valuations: [],
  };
  const load = modules({
    react: { ...state.react, useLayoutEffect: state.react.useEffect },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": { Pressable: "Button", Switch: "Switch", Text: "Text", View: "View" },
    "src/constants/assetStyles.ts": { getAssetStyles: () => ({}) },
    "src/components/assets/MemberAssetList.tsx": { MemberAssetList: "MemberList" },
    "src/components/assets/AssetEditorSheet.tsx": { AssetEditorSheet: "Editor" },
    "src/components/AppFooterContentInset.tsx": { AppFooterContentInset: "Inset" },
    "src/components/KeyboardAwareScrollView.tsx": { KeyboardAwareScrollView: "Scroll" },
    "src/hooks/usePersonalAssets.ts": {
      usePersonalAssets: () => ({
        portfolio,
        members: [{ userId: "me" }, { userId: "other" }],
        loading,
      }),
    },
  });
  const { AssetsScreen } = load("src/screens/AssetsScreen.tsx");
  const { AssetCopy } = load("src/constants/assets.ts");
  const { formatAssetAmount } = load("src/utils/assets.ts");
  let headerOptions;
  const setHeaderOptions = (options) => {
    headerOptions = options;
  };
  const read = () =>
    nodes(
      state.render(() =>
        AssetsScreen({
          bookId: "book",
          userId: "me",
          setHeaderOptions,
        }),
      ),
    );
  const amounts = (tree) =>
    tree.filter((node) => node.type === "Text").map((node) => node.props.children);
  const ownedIds = (tree) =>
    tree.find((node) => node.type === "MemberList").props.portfolio.assets.map((asset) => asset.id);
  const assetSwitch = (tree) => tree.find((node) => node.type === "Switch").props;

  let tree = read();
  assert.ok(amounts(tree).includes(formatAssetAmount(700)));
  assert.deepEqual(ownedIds(tree), ["cash", "loan", "shared"]);
  assert.equal(assetSwitch(tree).accessibilityLabel, AssetCopy.showMine);
  assert.equal(assetSwitch(tree).value, false);
  assetSwitch(tree).onValueChange(true);
  tree = read();
  assert.equal(assetSwitch(tree).value, true);
  assert.ok(amounts(tree).includes(formatAssetAmount(200)));
  assert.deepEqual(ownedIds(tree), ["cash", "loan"]);
  assetSwitch(tree).onValueChange(false);
  assert.deepEqual(ownedIds(read()), ["cash", "loan", "shared"]);

  const headerButton = () => headerOptions.unstable_headerRightItems({})[0];
  loading = true;
  read();
  assert.equal(headerButton().disabled, true);
  headerButton().onPress();
  assert.equal(read().some((node) => node.type === "Editor"), false);
  loading = false;
  assert.equal(amounts(read()).includes(AssetCopy.add), false);
  assert.equal(headerButton().label, AssetCopy.add);
  assert.equal(headerButton().disabled, false);
  headerButton().onPress();
  assert.equal(read().find((node) => node.type === "Editor").props.asset, null);
  state.unmount();
});
