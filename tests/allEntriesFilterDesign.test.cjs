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
  return {
    h,
    load: modules({
      react: h.react,
      "react/jsx-runtime": { jsx, jsxs: jsx },
      "react-native": {
        View: "View",
        Text: "Text",
        Pressable: "Button",
        StyleSheet: { create: (value) => value },
      },
      "src/components/AppIcons.tsx": { Feather: "Icon" },
      "src/components/EntryInlineDatePicker.tsx": { EntryInlineDatePicker: "DatePicker" },
    }),
  };
}
test("period presets keep the calendar collapsed while direct date edits reveal it without applying the filter", () => {
  const { h, load } = setup();
  const { AllEntriesPeriodFilter } = load("src/components/allEntries/AllEntriesPeriodFilter.tsx");
  const { AllEntriesPeriodPresets } = load("src/components/allEntries/AllEntriesPeriodPresets.tsx");
  const { resolveAllEntriesPeriod } = load("src/lib/allEntriesPeriods.ts");
  let range = resolveAllEntriesPeriod("this-month");
  const render = () =>
    nodes(
      h.render(() =>
        AllEntriesPeriodFilter({
          range,
          onChange: (value) => {
            range = value;
          },
        }),
      ),
    );
  let tree = render();
  assert.equal(
    tree.some((n) => n.type === "DatePicker"),
    false,
  );
  tree.find((n) => n.type === AllEntriesPeriodPresets).props.onCustom();
  tree = render();
  assert.ok(tree.some((n) => n.type === "DatePicker"));
  tree.find((n) => n.type === "DatePicker").props.onChange(new Date(2030, 0, 15));
  tree = render();
  assert.equal(range.startDate, "2030-01-15");
  assert.equal(range.endDate, "2030-01-15");
  tree
    .find((n) => n.type === AllEntriesPeriodPresets)
    .props.onChange(resolveAllEntriesPeriod("last-month"));
  tree = render();
  assert.equal(
    tree.some((n) => n.type === "DatePicker"),
    false,
  );
  assert.equal(range.startDate, resolveAllEntriesPeriod("last-month").startDate);
  tree.find((n) => n.type === AllEntriesPeriodPresets).props.onChange(null);
  tree = render();
  assert.equal(range, null);
  assert.equal(
    tree.some((n) => n.type === "DatePicker"),
    false,
  );
  h.unmount();
});
test("category tiles retain multi-selection, communicate checked state and reflow to the sheet width", () => {
  const { h, load } = setup();
  const { AllEntriesCategoryGroup } = load("src/components/allEntries/AllEntriesCategoryGroup.tsx");
  let selected = new Set();
  const categories = [
    { id: "food", iconName: "coffee", label: "Food" },
    { id: "home", iconName: "home", label: "Home" },
  ];
  const render = () =>
    nodes(
      h.render(() =>
        AllEntriesCategoryGroup({
          categories,
          title: "Expense",
          type: "expense",
          selectedCategoryIdSet: selected,
          onToggle: (id) => {
            selected = new Set(selected);
            if (selected.has(id)) selected.delete(id);
            else selected.add(id);
          },
        }),
      ),
    );
  let tree = render();
  const buttons = () => tree.filter((n) => n.props.accessibilityRole === "checkbox");
  assert.equal(buttons()[0].props.accessibilityState.checked, false);
  buttons()[0].props.onPress();
  tree = render();
  assert.equal(buttons()[0].props.accessibilityState.checked, true);
  buttons()[1].props.onPress();
  tree = render();
  assert.equal(buttons().filter((n) => n.props.accessibilityState.checked).length, 2);
  tree.find((n) => n.props.onLayout).props.onLayout({ nativeEvent: { layout: { width: 300 } } });
  tree = render();
  assert.ok(
    buttons()[0].props.style.some(
      (style) => typeof style?.flexBasis === "number" && style.flexBasis > 0,
    ),
  );
  buttons()[0].props.onPress();
  tree = render();
  assert.equal(buttons()[0].props.accessibilityState.checked, false);
  assert.equal(buttons()[1].props.accessibilityState.checked, true);
  h.unmount();
});
