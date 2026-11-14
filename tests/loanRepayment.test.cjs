const assert = require("node:assert/strict");
const test = require("node:test");
const { modules, hooks } = require("./annualReportHelpers.cjs");
const load = modules();
const { estimateLoanPayment, entryAssetLinkError, remainingLoanMonths, loanSettingsError } = load(
  "src/utils/loanRepayment.ts",
);
const { assetBalance, createAssetDraft, portfolioSummary } = load("src/utils/assets.ts");
const { createDraft, createDraftFromEntry } = load("src/utils/ledgerEntries.ts");
const { AssetLinkConfig: Config } = load("src/constants/assetLink.ts");

test("amortization calculates equal principal, annuity, zero rates and final payments with decimal rounding", () => {
  assert.deepEqual(
    { ...estimateLoanPayment(1200, "12", 12, "equal-principal") },
    { principal: "100", interest: "12", total: "112" },
  );
  assert.deepEqual(
    { ...estimateLoanPayment(1200, "0", 12, "annuity") },
    { principal: "100", interest: "0", total: "100" },
  );
  const annuity = estimateLoanPayment(100000000, "5", 360, "annuity");
  assert.equal(annuity.total, "536821.62");
  assert.equal(annuity.interest, "416666.67");
  const final = estimateLoanPayment(100, "12", 1, "annuity");
  assert.equal(final.principal, "100");
  assert.equal(final.total, "101");
  assert.equal(estimateLoanPayment(100, "", 12, "annuity"), null);
  assert.equal(estimateLoanPayment(100, "5", 0, "annuity"), null);
  assert.equal(estimateLoanPayment(100, "-1", 12, "annuity"), null);
  assert.equal(
    remainingLoanMonths({ loanMonths: "12", firstRepaymentDate: "2026-01-31" }, "2026-02-28"),
    11,
  );
  assert.equal(
    remainingLoanMonths({ loanMonths: "12", firstRepaymentDate: "2026-01-31" }, "2026-01-30"),
    0,
  );
  assert.ok(
    loanSettingsError({
      ...createAssetDraft("loan"),
      repayment: "annuity",
      rate: "5",
      loanMonths: "0",
    }),
  );
});

const baseline = (asset_id, amount) => ({
  id: asset_id,
  asset_id,
  amount,
  valued_on: "2026-01-01",
  created_at: "2026-01-01T00:00:00Z",
  details: {},
});
const portfolio = {
  assets: [
    { id: "cash", kind: "cash", deleted_on: null },
    { id: "loan", kind: "loan", deleted_on: null },
  ],
  valuations: [baseline("cash", 1000), baseline("loan", 5000)],
  movements: [
    {
      asset_id: "cash",
      entry_id: "payment",
      occurred_on: "2026-01-02",
      created_at: "2026-01-02T00:00:00Z",
      amount: -100,
    },
    {
      asset_id: "loan",
      entry_id: "payment",
      occurred_on: "2026-01-02",
      created_at: "2026-01-02T00:00:00Z",
      amount: -80,
    },
  ],
};

test("cash and principal affect net worth once, and a manual checkpoint includes prior movements", () => {
  assert.equal(assetBalance(portfolio, "cash", "2026-01-03"), 900);
  assert.equal(assetBalance(portfolio, "cash", "2026-01-03", "payment"), 1000);
  assert.equal(portfolioSummary(portfolio, "2026-01-03").net, -4020);
  const reset = {
    ...portfolio,
    valuations: [...portfolio.valuations, { ...baseline("cash", 700), valued_on: "2026-01-03" }],
  };
  assert.equal(assetBalance(reset, "cash", "2026-01-04"), 700);
  assert.equal(assetBalance(reset, "cash", "2026-01-02"), 900);
});

test("repayments require a loan, never exceed paid amounts, and reject installment and overdrawn links", () => {
  const draft = {
    ...createDraft("2026-01-02", "owner"),
    amount: "100",
    categoryId: Config.loanCategoryId,
    assetLink: {
      requestId: "payment",
      cashAssetId: "cash",
      loanAssetId: "loan",
      principal: "80",
      fee: "0",
    },
  };
  assert.equal(entryAssetLinkError(draft, portfolio, "payment"), null);
  for (const extra of [
    { loanAssetId: null },
    { principal: "101" },
    { principal: "80", fee: "21" },
    { cashAssetId: "missing" },
  ]) {
    assert.ok(
      entryAssetLinkError({ ...draft, assetLink: { ...draft.assetLink, ...extra } }, portfolio),
    );
  }
  assert.ok(entryAssetLinkError({ ...draft, installmentMonths: 2 }));
  assert.ok(entryAssetLinkError({ ...draft, amount: "1001" }, portfolio));
  assert.ok(entryAssetLinkError({ ...draft, type: "income" }));
  assert.equal(entryAssetLinkError({ ...draft, categoryId: "food", assetLink: undefined }), null);
});

test("reload and edit preserve linkage; duplication deliberately starts without a new asset deduction", () => {
  const { buildLedgerEntryMetadata } = load("src/lib/ledgerEntryMetadata.ts");
  const { mapLedgerEntryRow } = load("src/utils/ledgerMapper.ts");
  const link = {
    requestId: "payment",
    cashAssetId: "cash",
    loanAssetId: "loan",
    principal: "80",
    fee: "0",
  };
  const entry = mapLedgerEntryRow({
    id: "payment",
    user_id: "owner",
    entry_type: "expense",
    amount: 100,
    occurred_on: "2026-01-02",
    content: "상환",
    category_id: Config.loanCategoryId,
    category: "대출 상환",
    metadata: buildLedgerEntryMetadata("owner", null, link),
  });
  assert.deepEqual({ ...entry.assetLink }, link);
  assert.deepEqual({ ...createDraftFromEntry(entry, "owner").assetLink }, link);
  const copy = load("src/utils/duplicateLedgerEntry.ts").createDuplicateEntryDraft(
    entry,
    "2026-01-03",
    "owner",
    [{ userId: "owner" }],
    [{ id: Config.loanCategoryId, type: "expense", label: "대출 상환" }],
  );
  assert.equal(copy.assetLink, undefined);
});

test("loan selection fills calculated amounts and the configured account while keeping multiple accounts selectable", () => {
  const state = hooks();
  const jsx = (type, props) => ({ type, props });
  const options = {
    assets: [
      { id: "cash1", name: "급여 통장", kind: "cash" },
      { id: "cash2", name: "생활비 통장", kind: "cash" },
      { id: "loan1", name: "주택 대출", kind: "loan" },
      { id: "loan2", name: "신용 대출", kind: "loan" },
    ],
    valuations: [
      baseline("cash1", 10000),
      baseline("cash2", 10000),
      {
        ...baseline("loan1", 1200),
        details: {
          rate: "12",
          repayment: "equal-principal",
          loanMonths: "12",
          firstRepaymentDate: "2026-01-01",
          defaultCashAssetId: "cash1",
        },
      },
      {
        ...baseline("loan2", 2400),
        details: {
          rate: "12",
          repayment: "equal-principal",
          loanMonths: "12",
          firstRepaymentDate: "2026-01-01",
          defaultCashAssetId: "cash2",
        },
      },
    ],
  };
  const component = modules({
    react: state.react,
    "src/components/entryComposer/EntryAssetLinkFields.tsx": undefined,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "expo-crypto": { randomUUID: () => "request" },
    "react-native": { Pressable: "Button", Text: "Text", TextInput: "Input", View: "View" },
    "src/constants/assetStyles.ts": { getAssetStyles: () => ({}) },
    "src/hooks/useAssetLinkOptions.ts": {
      useAssetLinkOptions: () => ({ portfolio: options, error: false, retry() {} }),
    },
    "src/lib/currencyPreference.ts": { resolveDisplayCurrency: () => "KRW" },
    "src/components/assets/AssetLinkMenu.tsx": { AssetLinkMenu: "Menu" },
  })("src/components/entryComposer/EntryAssetLinkFields.tsx").EntryAssetLinkFields;
  const composer = {
    userId: "owner",
    members: [{ userId: "owner", role: "owner" }],
    draft: { ...createDraft("2026-01-01", "owner"), categoryId: Config.loanCategoryId },
    update(key, value) {
      this.draft = { ...this.draft, [key]: value };
    },
  };
  composer.update = composer.update.bind(composer);
  const nodes = (node) =>
    Array.isArray(node)
      ? node.flatMap(nodes)
      : node?.props
        ? [node, ...nodes(node.props.children)]
        : [];
  let tree = state.render(() => component({ composer, visible: true, bookId: "book" }));
  const loanMenu = nodes(tree).find(
    (node) => node.type === "Menu" && node.props.options[0]?.id === "loan1",
  );
  loanMenu.props.onChange("loan2");
  assert.equal(composer.draft.content, options.assets.find((asset) => asset.id === "loan2").name);
  assert.equal(composer.draft.amount, "224");
  assert.equal(composer.draft.assetLink.principal, "200");
  assert.equal(composer.draft.assetLink.cashAssetId, "cash2");
  tree = state.render(() => component({ composer, visible: true, bookId: "book" }));
  const cashMenu = nodes(tree).find(
    (node) => node.type === "Menu" && node.props.options[0]?.id === "cash1",
  );
  cashMenu.props.onChange("cash1");
  assert.equal(composer.draft.assetLink.loanAssetId, "loan2");
  assert.equal(composer.draft.assetLink.cashAssetId, "cash1");
  const switchLoan = () =>
    nodes(state.render(() => component({ composer, visible: true, bookId: "book" }))).find(
      (node) => node.type === "Menu" && node.props.options[0]?.id === "loan1",
    );
  switchLoan().props.onChange("loan1");
  assert.equal(composer.draft.content, options.assets.find((asset) => asset.id === "loan1").name);
  composer.update("content", "My repayment note");
  switchLoan().props.onChange("loan2");
  assert.equal(composer.draft.content, "My repayment note");
  composer.members.push({ userId: "other", role: "editor" });
  const shared = state.render(() => component({ composer, visible: true, bookId: "book" }));
  assert.equal(
    nodes(shared).some((node) => node.type === "Menu"),
    true,
  );
  composer.draft = { ...composer.draft, content: "", assetLink: undefined, categoryId: "other" };
  state.render(() => component({ composer, visible: true, bookId: "book" }));
  options.assets = options.assets.filter((asset) => asset.id !== "loan2");
  composer.draft = { ...composer.draft, categoryId: Config.loanCategoryId };
  state.render(() => component({ composer, visible: true, bookId: "book" }));
  assert.equal(composer.draft.assetLink.loanAssetId, "loan1");
  assert.equal(composer.draft.content, options.assets.find((asset) => asset.id === "loan1").name);
  assert.equal(composer.draft.assetLink.cashAssetId, "cash1");
  composer.draft = {
    ...composer.draft,
    assetLink: { ...composer.draft.assetLink, loanAssetId: null },
  };
  state.render(() => component({ composer, visible: true, bookId: "book" }));
  assert.equal(composer.draft.assetLink.loanAssetId, null);
  state.unmount();
});

const { estimateLoanFromSettings, editableLoanSettings } = load("src/utils/loanRepayment.ts");
test("fixed monthly payments calculate principal and cap the final payment", () => {
  const settings = { repayment: "annuity", rate: "12", monthlyPayment: "112" };
  assert.deepEqual(
    { ...estimateLoanFromSettings(1200, settings, "2026-01-01") },
    { principal: "100", interest: "12", total: "112" },
  );
  assert.deepEqual(
    { ...estimateLoanFromSettings(50, settings, "2026-01-01") },
    { principal: "50", interest: "0.5", total: "50.5" },
  );
  assert.equal(
    estimateLoanFromSettings(1200, { ...settings, monthlyPayment: "12" }, "2026-01-01"),
    null,
  );
  assert.equal(loanSettingsError({ ...createAssetDraft("loan"), ...settings }), null);
  assert.ok(loanSettingsError({ ...createAssetDraft("loan"), ...settings, monthlyPayment: "" }));
});
test("maturity dates count monthly installments inclusively and reject reversed schedules", () => {
  const settings = {
    ...createAssetDraft("loan"),
    repayment: "equal-principal",
    rate: "12",
    firstRepaymentDate: "2026-01-31",
    maturity: "2026-12-31",
  };
  assert.equal(remainingLoanMonths(settings, "2026-01-31"), 12);
  assert.equal(remainingLoanMonths(settings, "2026-02-28"), 11);
  assert.equal(remainingLoanMonths(settings, "2026-12-31"), 1);
  assert.equal(remainingLoanMonths(settings, "2027-01-01"), 0);
  assert.equal(loanSettingsError(settings), null);
  assert.ok(loanSettingsError({ ...settings, maturity: "2026-01-01" }));
  assert.deepEqual(
    { ...estimateLoanFromSettings(1200, settings, "2026-01-31") },
    { principal: "100", interest: "12", total: "112" },
  );
});
test("editing legacy loan settings derives payment and maturity without losing balances", () => {
  const draft = {
    ...createAssetDraft("loan"),
    amount: "1200",
    rate: "12",
    repayment: "annuity",
    loanMonths: "12",
    firstRepaymentDate: "2026-01-31",
    date: "2026-01-31",
  };
  assert.equal(editableLoanSettings(draft).monthlyPayment, "106.62");
  assert.equal(
    editableLoanSettings({ ...draft, repayment: "equal-principal" }).maturity,
    "2026-12-31",
  );
  assert.equal(
    editableLoanSettings({ ...draft, repayment: "equal-principal", loanMonths: "2" }).maturity,
    "2026-02-28",
  );
});
