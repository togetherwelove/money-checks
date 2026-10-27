const assert = require("node:assert/strict");
const test = require("node:test");
const { modules, hooks, entry, currencyMock } = require("./annualReportHelpers.cjs");

function ledger() {
  const h = hooks(),
    saved = [],
    removed = [],
    selectedRemoved = [],
    replaced = [],
    reset = [],
    selected = [];
  let entries = [],
    chart = [],
    revision = 0,
    saveError = null;
  const load = modules({
    react: h.react,
    "src/lib/currencyPreference.ts": currencyMock,
    "src/lib/installmentTransactions.ts": {
      deleteInstallmentGroup: async () => ["first", "second"],
      prepayInstallmentGroup: async () => ({
        deletedEntryIds: ["second"],
        installmentCount: 1,
        totalAmount: 100,
        prepaidEntryId: "paid",
      }),
    },
    "src/hooks/ledgerScreenState/helpers.ts": {
      saveLedgerEntry: async (options) => {
        if (saveError) throw saveError;
        saved.push(options);
        return options.entry;
      },
      saveLedgerEntries: async (options) => {
        if (saveError) throw saveError;
        saved.push(options);
        return options.entries.map((item, i) => ({ ...item, id: `new-${i}` }));
      },
      removeLedgerEntry: async (id) => removed.push(id),
      loadInstallmentEntries: async () => [entry("first"), entry("second")],
    },
  });
  const { createDraft } = load("src/utils/ledgerEntries.ts");
  const draft = {
    ...createDraft("2026-10-01", "me"),
    amount: "9000",
    content: "Coffee",
    category: "Food",
    categoryId: "food",
  };
  const { createLedgerEntryActions } = load("src/hooks/ledgerScreenState/ledgerEntryActions.ts");
  const options = {
    session: { user: { id: "me", user_metadata: { display_name: "Me" } } },
    activeBook: { id: "book" },
    entries,
    editor: {
      draft,
      editingEntryId: null,
      editingEntrySnapshot: null,
      selectedDate: draft.date,
      resetEditor: (date) => reset.push(date),
      handleSelectDate: (date) => selected.push(date),
    },
    trackBusyTask: (task) => task(),
    blockReadOnlyEditIfNeeded: () => false,
    entryData: {
      setEntries: (update) => {
        entries = update(entries);
      },
      removeEntriesFromCache: (ids) => removed.push(...ids),
      replaceInstallmentGroupInCache: (...args) => replaced.push(args),
    },
    selectedDateData: {
      removeSelectedDateEntries: (ids) => selectedRemoved.push(...ids),
      refreshSelectedDateEntries: async () => {},
    },
    setAllChartEntries: (update) => {
      chart = update(chart);
    },
    setLedgerMutationRevision: (update) => {
      revision = update(revision);
    },
  };
  return {
    load,
    h,
    draft,
    options,
    saved,
    removed,
    selectedRemoved,
    replaced,
    reset,
    selected,
    actions: () => createLedgerEntryActions(options),
    entries: () => entries,
    revision: () => revision,
    failSave: () => {
      saveError = new Error("offline");
    },
  };
}

test("editor retains draft within a book and resets edit identity on book changes", () => {
  const ui = ledger();
  const { useLedgerEditor } = ui.load("src/hooks/ledgerScreenState/useLedgerEditor.ts");
  let month = new Date(2026, 9, 1);
  const render = (book) =>
    ui.h.render(() =>
      useLedgerEditor("me", book, (update) => {
        month = update(month);
      }),
    );
  let state = render("a");
  state.updateDraftField("amount", "8,500");
  state.updateDraftField("content", "Draft");
  state = render("a");
  assert.equal(state.draft.amount, "8500");
  assert.equal(state.draft.content, "Draft");
  const original = entry("editing", {
    date: "2026-02-05",
    authorId: "other",
    targetMemberId: "other",
  });
  state.handleEditEntry(original);
  state = render("a");
  assert.equal(state.editingEntrySnapshot, original);
  assert.equal(state.draft.targetMemberId, "other");
  state = render("b");
  assert.equal(state.editingEntryId, null);
  assert.equal(state.editingEntrySnapshot, null);
  assert.equal(state.draft.content, "");
  assert.equal(state.selectedDate, original.date);
  state.handleSelectDate("2026-03-07");
  assert.equal(month.getMonth(), 2);
  assert.equal(render("b").draft.date, "2026-03-07");
  ui.h.unmount();
});

test("new drafts and existing edits keep their distinct identity and reset behavior", async () => {
  const ui = ledger();
  await ui.actions().handleSaveEntry();
  assert.deepEqual(ui.reset, [ui.draft.date]);
  assert.equal(ui.entries()[0].authorId, "me");
  await ui.actions().handleSaveEntry(ui.draft);
  assert.deepEqual(ui.selected, [ui.draft.date]);
  const original = entry("existing", {
    authorId: "other",
    authorName: "Other",
    authorHasBookAccess: false,
  });
  await ui.actions().handleSaveEntry(ui.draft, original);
  assert.equal(ui.saved[2].editingEntryId, "existing");
  assert.equal(ui.saved[2].entry.authorId, "other");
  assert.equal(ui.saved[2].entry.authorHasBookAccess, false);
  assert.equal(ui.saved[2].syncPhotoAttachments, false);
  assert.equal(ui.reset.length, 1);
  assert.equal(ui.selected.length, 1);
});

test("failed saves retain draft and edit state without publishing cache changes", async () => {
  const ui = ledger();
  ui.failSave();
  await assert.rejects(ui.actions().handleSaveEntry(ui.draft), /offline/);
  assert.equal(ui.draft.content, "Coffee");
  assert.deepEqual(ui.entries(), []);
  assert.deepEqual(ui.reset, []);
  assert.deepEqual(ui.selected, []);
});

test("read-only actions reject saves, deletion and installment changes before persistence", async () => {
  const ui = ledger();
  ui.options.blockReadOnlyEditIfNeeded = () => true;
  const actions = ui.actions(),
    item = entry("first", { installmentGroupId: "group" });
  assert.equal((await actions.handleSaveEntry()).length, 0);
  assert.equal((await actions.handleDeleteEntry(item, "single")).length, 0);
  assert.equal(await actions.previewInstallmentPrepayment(item, "2026-01-01"), null);
  assert.equal(await actions.prepayInstallmentEntry(item, "2026-01-01"), null);
  assert.equal(ui.saved.length, 0);
  assert.equal(ui.removed.length, 0);
  assert.equal(ui.revision(), 0);
});

test("group deletion updates both caches and clears an editor targeting a deleted entry", async () => {
  const ui = ledger();
  ui.options.editor.editingEntryId = "second";
  const { LedgerEntryDeleteScopes } = ui.load("src/types/ledgerEntryDeletion.ts");
  await ui
    .actions()
    .handleDeleteEntry(
      entry("first", { installmentGroupId: "group" }),
      LedgerEntryDeleteScopes.installmentGroup,
    );
  assert.deepEqual(ui.removed, ["first", "second"]);
  assert.deepEqual(ui.selectedRemoved, ["first", "second"]);
  assert.deepEqual(ui.reset, [ui.draft.date]);
  assert.equal(ui.revision(), 1);
});

test("installment prepayment refreshes group cache and returns the transaction outcome", async () => {
  const ui = ledger();
  const result = await ui
    .actions()
    .prepayInstallmentEntry(entry("first", { installmentGroupId: "group" }), "2026-01-01");
  assert.equal(result.prepaidEntryId, "paid");
  assert.equal(ui.replaced[0][0], "group");
  assert.equal(result.updatedEntries.length, 2);
  assert.equal(ui.revision(), 1);
});

test("tracked tasks retain busy state until overlapping success and failure both settle", async () => {
  const h = hooks();
  const { useTrackedTask } = modules({ react: h.react })("src/hooks/useTrackedTask.ts");
  const render = () => h.render(useTrackedTask);
  const state = render();
  let finish, fail;
  const first = state.trackTask(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const second = state.trackTask(
    () =>
      new Promise((_resolve, reject) => {
        fail = reject;
      }),
  );
  const rejection = assert.rejects(second, /offline/);
  assert.equal(render().taskCount, 2);
  assert.equal(render().trackTask, state.trackTask);
  finish("saved");
  assert.equal(await first, "saved");
  assert.equal(render().taskCount, 1);
  fail(new Error("offline"));
  await rejection;
  assert.equal(render().taskCount, 0);
  h.unmount();
});
