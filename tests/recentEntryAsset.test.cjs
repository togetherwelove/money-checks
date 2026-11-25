const assert = require("node:assert/strict");
const test = require("node:test");
const { modules, hooks } = require("./annualReportHelpers.cjs");

test("successful reset retains only the cash asset with a fresh request ID and scopes it by account and book", () => {
  const state = hooks();
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  let sequence = 0;
  const load = modules({
    react: state.react,
    "expo-crypto": { randomUUID: () => `request-${++sequence}` },
    "src/lib/appStorage.ts": { appStorage: storage },
    "src/lib/entryComposerDraftStorage.ts": { readEntryComposerDraft: () => null },
    "src/lib/ledgerBooks.ts": { fetchLedgerBookMembers: () => new Promise(() => {}) },
    "src/lib/imageAttachments.ts": {},
    "src/lib/nativeToast.ts": {},
  });
  const { useEntryComposer } = load("src/hooks/useEntryComposer.ts");
  const render = () => state.render(() => useEntryComposer("book", "2026-11-17", "self"));
  let composer = render();
  composer.update("assetLink", {
    requestId: "old",
    cashAssetId: "cash",
    loanAssetId: "loan",
    principal: "100",
    fee: "10",
  });
  composer = render();
  composer.reset(true);
  composer = render();
  assert.equal(composer.draft.assetLink.cashAssetId, "cash");
  assert.equal(composer.draft.assetLink.loanAssetId, null);
  assert.equal(composer.draft.assetLink.principal, "0");
  assert.equal(composer.draft.assetLink.fee, "0");
  assert.notEqual(composer.draft.assetLink.requestId, "old");
  const { readRecentEntryAsset } = load("src/lib/recentEntryAsset.ts");
  assert.equal(readRecentEntryAsset(storage, "self", "book"), "cash");
  assert.equal(readRecentEntryAsset(storage, "other", "book"), null);
  assert.equal(readRecentEntryAsset(storage, "self", "other-book"), null);
  composer.update("assetLink", undefined);
  composer = render();
  composer.reset();
  composer = render();
  assert.equal(composer.draft.assetLink.cashAssetId, "cash");
  composer.update("assetLink", undefined);
  composer = render();
  composer.reset(true);
  assert.equal(render().draft.assetLink, undefined);
  assert.equal(readRecentEntryAsset(storage, "self", "book"), null);
  state.unmount();
});

test("remembered cash selection alone does not require discard confirmation", () => {
  const load = modules();
  const { createDraft } = load("src/utils/ledgerEntries.ts");
  const { hasEntryComposerValues } = load("src/utils/entryComposer.ts");
  const draft = { ...createDraft("2026-11-17", "self"), assetLink: { cashAssetId: "cash" } };
  assert.equal(hasEntryComposerValues(draft, draft.date, "self", "cash"), false);
  assert.equal(hasEntryComposerValues(draft, draft.date, "self", "other"), true);
});
