const test = require("node:test");
const assert = require("node:assert/strict");
const { modules } = require("./annualReportHelpers.cjs");

test("asset list puts shared assets first, sorts names across kinds and opens the selected asset", () => {
  const jsx = (type, props) => ({ type, props });
  const { AssetList } = modules({
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": { Pressable: "Button", Text: "Text", View: "View" },
    "src/components/AppIcons.tsx": { Feather: "Icon" },
    "src/constants/assetStyles.ts": { AssetStyles: {} },
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
  const nodes = (node) =>
    Array.isArray(node)
      ? node.flatMap(nodes)
      : node?.props
        ? [node, ...nodes(node.props.children)]
        : [];
  const cards = nodes(tree).filter((node) => node.type === "Button");
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
