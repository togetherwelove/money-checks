const assert = require("node:assert/strict");
const test = require("node:test");
const { modules, hooks } = require("./annualReportHelpers.cjs");
const load = modules();
const { AssetKinds } = load("src/constants/assets.ts");

test("debt choices are loan and other debt, and other debt reduces net worth", () => {
  assert.deepEqual(
    Array.from(
      AssetKinds.filter((kind) => kind.group === "debt"),
      (kind) => kind.id,
    ),
    ["loan", "other-debt"],
  );
  assert.equal(
    portfolioSummary(
      {
        assets: [{ id: "other", kind: "other-debt", deleted_on: null }],
        valuations: [
          { asset_id: "other", valued_on: "2026-01-01", amount: 1000, created_at: "2026-01-01" },
        ],
      },
      "2026-01-01",
    ).net,
    -1000,
  );
});
const {
  createAssetDraft,
  assetAmount,
  assetDraftError,
  portfolioSummary,
  portfolioTrend,
  draftFromAsset,
} = load("src/utils/assets.ts");

test("stock quantities, property shares and zero balances are valued without creating income", () => {
  const stock = { ...createAssetDraft("stock"), name: "주식", quantity: "1.5", unitPrice: "20000" };
  assert.equal(assetDraftError(stock), null);
  assert.equal(assetAmount(stock), 30000);
  const property = {
    ...createAssetDraft("property"),
    name: "우리 집",
    amount: "600000000",
    share: "50",
  };
  assert.equal(assetAmount(property), 300000000);
  assert.equal(assetDraftError({ ...createAssetDraft(), name: "통장", amount: "0" }), null);
  for (const extra of [
    { share: "0" },
    { share: "101" },
    { amount: "-1" },
    { amount: "Infinity" },
    { date: "2099-01-01" },
    { date: "2026-02-30" },
  ]) {
    assert.ok(assetDraftError({ ...property, ...extra }));
  }
  assert.ok(assetDraftError({ ...stock, quantity: "-1" }));
  assert.ok(assetDraftError({ ...stock, averagePrice: "invalid" }));
});

const assets = [
  { id: "house", kind: "property", name: "집", note: "", deleted_on: null },
  { id: "loan", kind: "loan", name: "대출", note: "", deleted_on: null },
  { id: "car", kind: "car", name: "자동차", note: "", deleted_on: "2026-03-10" },
];
const valuation = (asset_id, valued_on, amount, details = {}) => ({
  id: `${asset_id}-${valued_on}`,
  asset_id,
  valued_on,
  amount,
  details,
  created_at: valued_on,
});
const portfolio = {
  assets,
  valuations: [
    valuation("house", "2026-01-15", 300000000, { amount: "600000000", share: "50" }),
    valuation("house", "2026-03-05", 350000000),
    valuation("loan", "2026-01-15", 100000000),
    valuation("loan", "2026-02-05", 90000000),
    valuation("car", "2026-02-01", 20000000),
  ],
};

test("net worth uses the last known valuation at each date and subtracts debts exactly once", () => {
  assert.deepEqual(
    { ...portfolioSummary(portfolio, "2026-01-31") },
    { total: 300000000, debt: 100000000, net: 200000000 },
  );
  assert.equal(portfolioSummary(portfolio, "2026-02-28").net, 230000000);
  assert.equal(portfolioSummary(portfolio, "2026-03-31").net, 260000000);
  assert.equal(portfolioSummary(portfolio, "2025-12-31").net, 0);
  const trend = portfolioTrend(portfolio, "2026-03-20");
  assert.deepEqual(
    Array.from(trend, (point) => [point.date, point.net]),
    [
      ["2026-01-31", 200000000],
      ["2026-02-28", 230000000],
      ["2026-03-20", 260000000],
    ],
  );
});

test("editing retains holding inputs and records a new valuation as of today by default", () => {
  const draft = draftFromAsset(assets[0], portfolio.valuations[0]);
  assert.equal(draft.amount, "600000000");
  assert.equal(draft.share, "50");
  assert.equal(draft.name, "집");
  assert.notEqual(draft.date, "2026-01-15");
});

test("same-day revisions retain history and the latest revision determines net worth", () => {
  const first = { ...valuation("cash", "2026-03-10", 100), created_at: "2026-03-10T09:00:00Z" };
  const second = { ...valuation("cash", "2026-03-10", 200), created_at: "2026-03-10T10:00:00Z" };
  const snapshot = {
    assets: [{ id: "cash", kind: "cash", deleted_on: null }],
    valuations: [second, first],
  };
  assert.equal(portfolioSummary(snapshot, "2026-03-10").net, 200);
  assert.equal(snapshot.valuations.length, 2);
});

function editor(save, props = {}) {
  const state = hooks(),
    alerts = [],
    closed = [],
    refreshed = [];
  const jsx = (type, props) => ({ type, props });
  const component = modules({
    react: state.react,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": {
      Alert: { alert: (...args) => alerts.push(args) },
      Switch: "Switch",
      Pressable: "Button",
      Text: "Text",
      View: "View",
    },
    "src/constants/assetStyles.ts": { getAssetStyles: () => ({}) },
    "src/components/NativeSelectionSheet.tsx": { NativeSelectionSheet: "Sheet" },
    "src/components/KeyboardAwareScrollView.tsx": { KeyboardAwareScrollView: "Scroll" },
    "src/components/assets/AssetDraftFields.tsx": { AssetDraftFields: "Fields" },
    "src/lib/personalAssets.ts": { savePersonalAsset: save, deletePersonalAsset: async () => {} },
  })("src/components/assets/AssetEditorSheet.tsx").AssetEditorSheet;
  const render = () =>
    state.render(() =>
      component({
        asset: null,
        history: [],
        bookId: "book",
        userId: "owner",
        ...props,
        onClose: () => closed.push(true),
        onSaved: async () => refreshed.push(true),
      }),
    );
  const fields = () =>
    render().props.children.props.children[0].props.children.find(
      (child) => child?.type === "Fields",
    ).props;
  return { render, fields, alerts, closed, refreshed, unmount: state.unmount };
}

test("asset sheet shows seven kinds with cash and savings combined", () => {
  const ui = editor(async () => {});
  const nodes = (node) =>
    Array.isArray(node)
      ? node.flatMap(nodes)
      : node?.props
        ? [node, ...nodes(node.props.children)]
        : [];
  const choices = nodes(ui.render()).filter((node) => node.props.accessibilityRole === "radio");
  assert.deepEqual(
    choices.map((node) => node.props.children.props.children),
    ["현금·저축", "투자 계좌", "부동산", "자동차", "기타 자산", "대출", "기타 부채"],
  );
  assert.equal(
    ui.render().props.children.props.children[0].props.children[1].props.children.length,
    7,
  );
  ui.unmount();
});

test("asset sheet confirms dirty dismissal, locks duplicate saves and retains input on failure", async () => {
  let rejectSave,
    calls = 0;
  const ui = editor(() => {
    calls++;
    return new Promise((_, reject) => {
      rejectSave = reject;
    });
  });
  ui.fields().update("name", "급여 통장");
  ui.fields().update("amount", "1000");
  let tree = ui.render();
  assert.equal(tree.props.requiresCloseConfirmation, true);
  tree.props.onClose();
  assert.equal(ui.alerts.length, 1);
  assert.equal(ui.closed.length, 0);
  tree.props.action.onPress();
  tree.props.action.onPress();
  assert.equal(calls, 1);
  tree = ui.render();
  assert.equal(tree.props.dismissible, false);
  tree.props.onClose();
  assert.equal(ui.alerts.length, 1);
  rejectSave(new Error("offline"));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(ui.fields().draft.name, "급여 통장");
  assert.equal(ui.fields().draft.amount, "1000");
  assert.equal(ui.render().props.action.loading, false);
  assert.equal(ui.closed.length, 0);
  assert.equal(ui.refreshed.length, 0);
  ui.unmount();
});

test("successful asset saves close the sheet and refresh the personal portfolio", async () => {
  const ui = editor(async () => {});
  ui.fields().update("name", "통장");
  ui.fields().update("amount", "0");
  ui.render().props.action.onPress();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(ui.closed.length, 1);
  assert.equal(ui.refreshed.length, 1);
  ui.unmount();
});

test("persistence only invokes asset RPCs, propagates failures and paginates complete history", async () => {
  const calls = [];
  const client = modules({
    "src/lib/supabase.ts": {
      supabase: {
        rpc: async (name, args) => {
          calls.push([name, args]);
          return { error: null };
        },
        from: (table) => ({
          select: () => ({
            eq: (column, owner) => ({
              order(orderColumn) {
                assert.ok(
                  table === "ledger_asset_movements"
                    ? ["asset_id", "entry_id"].includes(orderColumn)
                    : orderColumn === "id",
                );
                return this;
              },
              range: async (start) => {
                calls.push([table, column, owner, start]);
                return {
                  data:
                    start === 0
                      ? Array.from({ length: 1000 }, (_, index) => ({ id: `${table}-${index}` }))
                      : [{ id: "last" }],
                  error: null,
                };
              },
            }),
          }),
        }),
      },
    },
  })("src/lib/personalAssets.ts");
  await client.savePersonalAsset(null, { ...createAssetDraft(), name: "통장", amount: "1000" });
  await client.deletePersonalAsset("asset");
  assert.equal(calls[0][0], "save_personal_asset");
  assert.equal(calls[1][0], "delete_personal_asset");
  const result = await client.fetchPersonalAssets("owner");
  assert.equal(result.assets.length, 1001);
  assert.equal(result.valuations.length, 1001);
  assert.ok(calls.slice(2).every((call) => call[1] === "book_id" && call[2] === "owner"));
  const failed = modules({
    "src/lib/supabase.ts": { supabase: { rpc: async () => ({ error: new Error("failed") }) } },
  })("src/lib/personalAssets.ts");
  await assert.rejects(failed.deletePersonalAsset("asset"), /failed/);
});

test("refresh ignores an old account response and removes its foreground subscription", async () => {
  const state = hooks();
  const requests = [],
    removed = [];
  const usePersonalAssets = modules({
    react: state.react,
    "@react-navigation/native": { useIsFocused: () => true },
    "react-native": {
      AppState: { addEventListener: () => ({ remove: () => removed.push(true) }) },
    },
    "src/lib/personalAssets.ts": {
      fetchPersonalAssets: (user) => new Promise((resolve) => requests.push({ user, resolve })),
    },
  })("src/hooks/usePersonalAssets.ts").usePersonalAssets;
  state.render(() => usePersonalAssets("first"));
  state.render(() => usePersonalAssets("second"));
  requests[1].resolve({ assets: [{ id: "second" }], valuations: [] });
  await new Promise((resolve) => setImmediate(resolve));
  requests[0].resolve({ assets: [{ id: "first" }], valuations: [] });
  await new Promise((resolve) => setImmediate(resolve));
  const current = state.render(() => usePersonalAssets("second"));
  assert.equal(current.portfolio.assets[0].id, "second");
  state.unmount();
  assert.equal(removed.length, 2);
});

test("asset sharing starts private, persists only on save and foreign assets are read-only", async () => {
  const calls = [];
  const ui = editor(async (...args) => calls.push(args));
  const nodes = (node) =>
    Array.isArray(node)
      ? node.flatMap(nodes)
      : node?.props
        ? [node, ...nodes(node.props.children)]
        : [];
  let toggle = nodes(ui.render()).find((node) => node.type === "Switch");
  assert.equal(toggle.props.value, false);
  ui.fields().update("name", "cash");
  ui.fields().update("amount", "100");
  toggle.props.onValueChange(true);
  assert.equal(calls.length, 0);
  ui.render().props.action.onPress();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls[0][2], "book");
  assert.equal(calls[0][3], true);
  ui.unmount();
  const viewer = editor(async () => assert.fail("foreign asset must not save"), {
    asset: {
      id: "foreign",
      user_id: "other",
      kind: "cash",
      name: "cash",
      note: "",
      is_shared: true,
    },
    history: [{ details: { amount: "100" }, amount: 100 }],
  });
  assert.equal(viewer.render().props.action, undefined);
  assert.equal(nodes(viewer.render()).find((node) => node.type === "Switch").props.disabled, true);
  assert.equal(viewer.fields().disabled, true);
  viewer.unmount();
});

test("investment account totals replace holding inputs and retain legacy valuations", () => {
  const draft = { ...createAssetDraft("stock"), name: "증권계좌", amount: "12500000" };
  assert.equal(assetAmount(draft), 12500000);
  assert.equal(assetDraftError(draft), null);
  const legacy = draftFromAsset(
    { kind: "stock", name: "기존 주식", note: "" },
    {
      amount: 30000,
      details: { quantity: "1.5", unitPrice: "20000", averagePrice: "10000" },
    },
  );
  assert.equal(legacy.amount, "30000");
  assert.equal(assetAmount(legacy), 30000);
  assert.equal(assetDraftError(legacy), null);
  assert.equal(assetAmount({ ...legacy, amount: "40000" }), 40000);
});

test("monthly records disclose carried valuations separately from confirmed values", () => {
  const trend = portfolioTrend(portfolio, "2026-03-20");
  assert.deepEqual(
    Array.from(trend, ({ confirmed, count }) => [confirmed, count]),
    [
      [2, 3],
      [2, 3],
      [1, 2],
    ],
  );
});
