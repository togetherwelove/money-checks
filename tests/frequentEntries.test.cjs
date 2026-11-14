const assert = require("node:assert/strict");
const test = require("node:test");
const { modules, entry, hooks, currencyMock } = require("./annualReportHelpers.cjs");

function setup() {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  const load = modules();
  return { storage, values, ...load("src/lib/frequentEntries.ts") };
}

test("favorites persist a snapshot without photos, asset links or installment state and isolate user/book scopes", () => {
  const api = setup();
  const original = entry("meal", {
    installmentGroupId: "group",
    installmentMonths: 3,
    note: "memo (2/3)",
    photoAttachments: [{ uri: "private" }],
    assetLink: { cashAssetId: "private" },
  });
  const before = JSON.stringify(original);
  assert.equal(api.addFrequentEntry(api.storage, "user", "book", original), true);
  assert.equal(api.addFrequentEntry(api.storage, "user", "book", original), false);
  const [saved] = api.readFrequentEntries(api.storage, "user", "book");
  assert.equal(saved.note, "memo");
  for (const key of [
    "photoAttachments",
    "assetLink",
    "installmentMonths",
    "installmentGroupId",
    "date",
  ])
    assert.equal(saved[key], undefined);
  assert.equal(JSON.stringify(original), before);
  assert.equal(api.readFrequentEntries(api.storage, "other", "book").length, 0);
  assert.equal(api.readFrequentEntries(api.storage, "user", "other").length, 0);
  original.content = "changed";
  assert.equal(api.readFrequentEntries(api.storage, "user", "book")[0].content, "테스트");
  api.removeFrequentEntry(api.storage, "user", "book", "meal");
  assert.equal(api.readFrequentEntries(api.storage, "user", "book").length, 0);
});

test("favorites resolve current categories and members and use the selected date when loaded", () => {
  const api = setup();
  api.addFrequentEntry(api.storage, "user", "book", entry("meal"));
  const saved = api.readFrequentEntries(api.storage, "user", "book")[0];
  const load = modules();
  const draft = load("src/utils/duplicateLedgerEntry.ts").createDuplicateEntryDraft(
    saved,
    "2026-11-09",
    "user",
    [{ userId: "user", displayName: "Me" }],
    [],
  );
  assert.equal(draft.date, "2026-11-09");
  assert.equal(draft.targetMemberId, "user");
  assert.equal(draft.categoryId, "");
  assert.equal(draft.photoAttachments.length, 0);
  assert.equal(draft.assetLink, undefined);
});

test("picker loads a favorite without saving and removes it without selecting it", () => {
  const api = setup();
  api.addFrequentEntry(api.storage, "user", "book", entry("meal"));
  api.addFrequentEntry(api.storage, "user", "book", entry("other-meal", { amount: 25000 }));
  const state = hooks();
  const jsx = (type, props) => ({ type, props });
  const selected = [];
  const load = modules({
    react: state.react,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "src/components/AppIcons.tsx": { Feather: "Feather" },
    "@react-native-menu/menu": { MenuView: "Menu" },
    "react-native": {
      View: "View",
      Text: "Text",
      Pressable: "Pressable",
      Keyboard: { dismiss() {} },
      StyleSheet: { create: (x) => x },
    },
    "src/lib/appStorage.ts": { appStorage: api.storage },
    "src/lib/nativeToast.ts": { showNativeToast() {} },
    "src/lib/currencyPreference.ts": currencyMock,
  });
  const { FrequentEntryPicker } = load("src/components/entryComposer/FrequentEntryPicker.tsx");
  const props = {
    userId: "user",
    bookId: "book",
    visible: true,
    disabled: false,
    onSelect: (item) => selected.push(item),
  };
  const render = () => state.render(() => FrequentEntryPicker(props));
  const menu = () => render().props.children;
  const select = (id) => menu().props.onPressAction({ nativeEvent: { event: id } });
  menu().props.onOpenMenu();
  assert.equal(menu().props.children.props.accessibilityState.expanded, true);
  const actions = menu().props.actions;
  const mealMenu = actions.find((action) => action.id === "entry:meal");
  const otherMealMenu = actions.find((action) => action.id === "entry:other-meal");
  assert.equal(actions.length, 2);
  assert.notEqual(mealMenu.title, otherMealMenu.title);
  const [useMeal, removeMeal] = mealMenu.subactions;
  const [useOtherMeal, removeOtherMeal] = otherMealMenu.subactions;
  assert.equal(useMeal.title, "불러오기");
  assert.equal(removeMeal.title, "목록에서 제거");
  assert.equal(removeMeal.attributes.destructive, true);
  select(useMeal.id);
  assert.equal(selected.length, 1);
  assert.equal(selected[0].id, "meal");
  assert.equal(api.readFrequentEntries(api.storage, "user", "book").length, 2);
  props.disabled = true;
  select(useMeal.id);
  select(removeMeal.id);
  assert.equal(selected.length, 1);
  assert.equal(api.readFrequentEntries(api.storage, "user", "book").length, 2);
  props.disabled = false;
  select(removeMeal.id);
  assert.equal(selected.length, 1);
  const remaining = api.readFrequentEntries(api.storage, "user", "book");
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].id, "other-meal");
  select(useOtherMeal.id);
  assert.equal(selected[1].id, "other-meal");
  select(removeOtherMeal.id);
  assert.equal(selected.length, 2);
  assert.equal(api.readFrequentEntries(api.storage, "user", "book").length, 0);
  assert.equal(menu().props.actions[0].attributes.disabled, true);
  props.bookId = "other";
  select("use:meal");
  assert.equal(selected.length, 2);
});
