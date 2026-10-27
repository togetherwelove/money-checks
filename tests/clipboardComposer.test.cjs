const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

function mountComposer(initial = {}, disabled = false, props = {}) {
  let draft = { amount: "", content: "", note: "", categoryId: "", photoAttachments: [], ...initial };
  const writes = [], alerts = [], states = [], effects = [];
  let handle, saves = 0, resets = 0;
  const stateValues = [];
  const refValues = [];
  let refIndex = 0;
  let stateIndex = 0;
  const jsx = (type, props) => ({ type, props });
  const mocks = {
    "./EntryComposerSheet": { EntryComposerSheet: "Sheet" },
    "./EntryComposerHeader": { EntryComposerHeader: "Header" },
    "./EntryComposerPanel": { EntryComposerPanel: "Panel" },
    "../../hooks/useLedgerCategories": { useLedgerCategories: () => props.categories ?? [
      { id: "food", label: "Food", type: "expense" },
    ] },
    "../lib/currencyPreference": { resolveDisplayCurrency: () => "KRW" },
    react: {
      useState: (value) => {
        const index = stateIndex++;
        if (!(index in stateValues)) stateValues[index] = value;
        return [stateValues[index], (next) => { states.push(next); stateValues[index] = typeof next === "function" ? next(stateValues[index]) : next; }];
      },
      useRef: (current) => refValues[refIndex++] ??= { current },
      useEffect: (effect) => effects.push(effect),
      useImperativeHandle: (_, factory) => { handle = factory(); },
    },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": {
      Pressable: "Pressable", View: "View", Modal: "Modal", Text: "Text", TextInput: "TextInput",
      StyleSheet: { create: (styles) => styles }, Keyboard: { dismiss() {} },
      Alert: { alert: (...args) => alerts.push(args) },
    },
    "../../hooks/useEntryComposer": { useEntryComposer: () => ({
      draft, update() {}, members: props.members ?? [{ userId: "self", displayName: "Me" }],
      setDraft: (value) => { draft = typeof value === "function" ? value(draft) : value; writes.push(draft); },
      reset() {
        resets++;
        draft = load(path.join(__dirname, "../src/utils/ledgerEntries.ts")).createDraft(props.selectedDate ?? "2026-10-24", "self");
      },
    }) },
  };
  function load(file) {
    const exports = {};
    const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    vm.runInNewContext(source, { exports, require: (name) => {
      if (mocks[name]) return mocks[name];
      if (name === "./EntryComposerForm") return load(path.resolve(path.dirname(file), `${name}.tsx`));
      if (name.includes("/constants/") || name.includes("/utils/") || name === "./amount" || name === "./currency" || name === "./ledgerEntries" || name === "../lib/installments") return load(path.resolve(path.dirname(file), `${name}.ts`));
      return new Proxy({}, { get: (_, key) => key === "__esModule" ? true : () => null });
    } });
    return exports;
  }
  const { EntryComposer } = load(path.join(__dirname, "../src/components/entryComposer/EntryComposer.tsx"));
  const nodes = [];
  function visit(node) {
    if (Array.isArray(node)) { node.forEach(visit); return; }
    if (!node?.props) return;
    nodes.push(node);
    visit(node.props.header);
    if (node.type?.name === "EntryComposerForm") visit(node.type(node.props));
    visit(node.props.children);
  }
  function render() {
    stateIndex = 0;
    refIndex = 0;
    nodes.length = 0;
    visit(EntryComposer({ sheet: { visible: true, onClose() {} }, selectedDate: "2026-10-24", userId: "self", disabled, onSave: () => { saves++; }, ...props }));
  }
  render();
  const cleanups = effects.splice(0).map((effect) => effect()).filter(Boolean);
  const flushEffects = () => effects.splice(0).forEach(effect => {
    const cleanup = effect();
    if (cleanup) cleanups.push(cleanup);
  });
  return { get handle() { return handle; }, get draft() { return draft; }, resets: () => resets, render, flushEffects, writes, alerts, states, nodes, saves: () => saves, unmount: () => cleanups.forEach((cleanup) => cleanup()) };
}

const imported = { date: "2026-09-01", amount: "8500", content: "Lunch", type: "expense", categoryId: "", note: "", photoAttachments: [] };
const existing = { ...imported, id: "existing-entry", amount: 8500, categoryId: "food", category: "Food", targetMemberId: "other", installmentMonths: 3 };

test("duplicate opens review without saving, removes installment and photos, and saves as new", async () => {
  let saved;
  const reviewVisibility = [];
  const source = { ...existing, date: "2026-01-01", installmentGroupId: "group", installmentOrder: 2,
    installmentStatus: "prepaid", note: "memo (2/3)", photoAttachments: [{ id: "photo", uri: "remote" }] };
  const snapshot = JSON.stringify(source);
  const ui = mountComposer({}, false, { members: [{ userId: "self", displayName: "Me" }, { userId: "other", displayName: "Other" }],
    onEntryReviewChange: open => reviewVisibility.push(open),
    onSave: async (...args) => { saved = args; return true; } });
  ui.handle.duplicateEntry(source);
  assert.deepEqual(reviewVisibility, [true]);
  assert.equal(saved, undefined);
  assert.equal(ui.draft.date, "2026-10-24");
  assert.equal(ui.draft.amount, "8500");
  assert.equal(ui.draft.targetMemberId, "other");
  assert.equal(ui.draft.installmentMonths, 1);
  assert.equal(ui.draft.installmentGroupId, undefined);
  assert.equal(ui.draft.installmentStatus, undefined);
  assert.equal(ui.draft.id, undefined);
  assert.equal(ui.draft.photoAttachments.length, 0);
  assert.equal(ui.draft.note, "memo");
  ui.render();
  ui.handle.discardDeletedEntry([source]);
  assert.equal(ui.resets(), 0);
  await ui.nodes.find((node) => node.props.actionLabel === "등록").props.onAction();
  assert.equal(saved[1], undefined);
  assert.deepEqual(reviewVisibility, [true, false]);
  assert.equal(JSON.stringify(source), snapshot);
});

test("duplicate requires confirmation before replacing an edit and clears edit identity", async () => {
  let saved;
  const ui = mountComposer({}, false, { onSave: async (...args) => { saved = args; return true; } });
  ui.handle.editEntry(existing);
  ui.render();
  ui.handle.duplicateEntry(existing);
  assert.equal(ui.alerts.length, 1);
  assert.equal(ui.writes.length, 1);
  ui.alerts[0][2][1].onPress();
  ui.render();
  await ui.nodes.find((node) => node.props.actionLabel === "등록").props.onAction();
  assert.equal(saved[1], undefined);
});

test("duplicate resolves stale members and categories and preserves ordinary notes", () => {
  const ui = mountComposer({}, false, { categories: [] });
  ui.handle.duplicateEntry({ ...existing, installmentMonths: 1, note: "reference (2/3)" });
  assert.equal(ui.draft.targetMemberId, "self");
  assert.equal(ui.draft.categoryId, "");
  assert.equal(ui.draft.note, "reference (2/3)");
  ui.render();
  assert.equal(ui.nodes.some((node) => node.props.actionLabel === "등록" && !node.props.actionDisabled), false);
});

test("duplicate cannot replace input after unmount or while disabled", () => {
  const disabled = mountComposer({}, true);
  disabled.handle.duplicateEntry(existing);
  assert.equal(disabled.writes.length, 0);
  const ui = mountComposer(imported);
  ui.handle.duplicateEntry(existing);
  assert.equal(ui.writes.length, 0);
  ui.unmount();
  ui.alerts[0][2][1].onPress();
  assert.equal(ui.writes.length, 0);
});

test("failed duplicate save retains draft and rejects overlapping saves", async () => {
  let finish;
  let attempts = 0;
  const ui = mountComposer({}, false, { onSave: () => { attempts++; return new Promise(resolve => { finish = resolve; }); } });
  ui.handle.duplicateEntry(existing);
  ui.render();
  const save = ui.nodes.find((node) => node.props.actionLabel === "등록").props.onAction;
  const pending = save();
  await save();
  assert.equal(attempts, 1);
  ui.handle.duplicateEntry({ ...existing, amount: 999 });
  assert.equal(ui.draft.amount, "8500");
  finish(false);
  await pending;
  assert.equal(ui.resets(), 0);
  assert.equal(ui.draft.amount, "8500");
});

test("disabled composer keeps the full form visible and rejects saving", async () => {
  const ui = mountComposer({}, false, { disabled: true });
  const inputs = ui.nodes.filter(node => node.type === "TextInput");
  assert.equal(inputs.length, 3);
  assert.equal(inputs.every(node => node.props.editable === false), true);
  const header = ui.nodes.find(node => node.props.actionLabel === "등록");
  assert.equal(header.props.actionDisabled, true);
  await header.props.onAction();
  assert.equal(ui.saves(), 0);
});

test("unchanged edits close without confirmation while changed edits ask until reverted", () => {
  let closed = 0;
  const ui = mountComposer({}, false, { sheet: { visible: true, onClose: () => closed++ } });
  ui.handle.editEntry(existing);
  ui.render();
  ui.nodes[0].props.onClose();
  assert.equal(closed, 1);
  assert.equal(ui.alerts.length, 0);
  ui.render();
  ui.handle.editEntry(existing);
  ui.render();
  ui.draft.content = 'Changed';
  ui.render();
  ui.nodes[0].props.onClose();
  assert.equal(closed, 1);
  assert.equal(ui.alerts.length, 1);
  ui.alerts[0][2].find(button => button.style === 'cancel').onPress();
  ui.draft.content = existing.content;
  ui.render();
  ui.nodes[0].props.onClose();
  assert.equal(closed, 2);
  assert.equal(ui.alerts.length, 1);
});

test("closing an unchanged edit clears its identity so plus opens a new draft and saves as new", async () => {
  let saved;
  const sheet = { visible: true, onClose() { sheet.visible = false; } };
  const ui = mountComposer({}, false, { sheet, onSave: async (...args) => { saved = args; return true; } });
  ui.handle.editEntry(existing);
  ui.render();
  ui.nodes[0].props.onClose();
  ui.render();
  assert.equal(ui.alerts.length, 0);
  assert.equal(ui.resets(), 1);
  assert.equal(ui.handle.isBusy(), false);
  sheet.visible = true;
  ui.render();
  assert.equal(ui.nodes[0].props.header.props.actionLabel, "등록");
  assert.equal(ui.draft.amount, "");
  assert.equal(ui.draft.content, "");
  assert.equal(ui.draft.note, "");
  assert.equal(ui.draft.categoryId, "");
  assert.equal(ui.draft.date, "2026-10-24");
  ui.draft.amount = "1000";
  ui.draft.content = "New entry";
  ui.draft.categoryId = "food";
  ui.render();
  await ui.nodes[0].props.header.props.onAction();
  assert.equal(saved[1], undefined);
});

test("editing preserves the original identity and member and saves as an update", async () => {
  let saved;
  const composer = mountComposer({}, false, { onSave: async (...args) => { saved = args; return true; } });
  composer.handle.editEntry(existing);
  assert.equal(composer.writes[0].targetMemberId, "other");
  assert.equal(composer.writes[0].installmentMonths, 3);
  assert.equal(saved, undefined);
  composer.render();
  await composer.nodes.find((node) => node.props.actionLabel === "저장").props.onAction();
  assert.equal(saved[1].id, existing.id);
  assert.equal(saved[0].date, existing.date);
});

test("canceling editing never saves and returns to new entry mode", () => {
  const changes = [];
  const composer = mountComposer({}, false, { onEntryReviewChange: (editing) => changes.push(editing) });
  composer.handle.editEntry(existing);
  composer.draft.note = "changed memo";
  composer.render();
  composer.nodes[0].props.onClose();
  composer.render();
  assert.equal(composer.alerts.length, 1);
  assert.equal(composer.resets(), 0);
  composer.alerts.at(-1)[2].find(button => button.style === "destructive").onPress();
  composer.render();
  assert.deepEqual(changes, [true, false]);
  assert.equal(composer.saves(), 0);
  assert.equal(composer.resets(), 1);
  assert.equal(composer.draft.amount, "");
  assert.equal(composer.draft.content, "");
  assert.equal(composer.nodes.some(node => node.type === "Modal"), false);
  assert.equal(composer.nodes.find((node) => node.props.onChangeText).props.value, "");
  assert.equal(composer.handle.isBusy(), false);
});

test("discarding a new imported draft clears input without saving", () => {
  const composer = mountComposer();
  composer.handle.importDraft(imported);
  composer.render();
  composer.nodes[0].props.onClose();
  composer.render();
  composer.alerts.at(-1)[2].find(button => button.style === "destructive").onPress();
  composer.render();
  assert.equal(composer.resets(), 1);
  assert.equal(composer.saves(), 0);
  assert.equal(composer.handle.isBusy(), false);
  assert.equal(composer.draft.amount, "");
  assert.equal(composer.draft.content, "");
});

for (const dismiss of ["continue", "systemBack"]) test(`dismiss discard confirmation via ${dismiss} preserves editing and input`, () => {
  const changes = [];
  const composer = mountComposer({}, false, { onEntryReviewChange: value => changes.push(value) });
  composer.handle.editEntry(existing);
  composer.draft.note = "changed memo";
  composer.render();
  const before = composer.draft;
  composer.nodes[0].props.onClose();
  composer.render();
  if (dismiss === "continue") composer.alerts.at(-1)[2].find(button => button.style === "cancel").onPress();
  else composer.alerts.at(-1)[3].onDismiss();
  composer.render();
  assert.equal(composer.nodes.some(node => node.type === "Modal"), false);
  assert.equal(composer.draft, before);
  assert.equal(composer.resets(), 0);
  assert.equal(composer.saves(), 0);
  assert.deepEqual(changes, [true]);
});

test("discard confirmation prevents duplicate alerts and ignores confirmation after unmount", () => {
  const composer = mountComposer();
  composer.handle.importDraft(imported);
  composer.render();
  const cancel = composer.nodes[0];
  cancel.props.onClose();
  cancel.props.onClose();
  assert.equal(composer.alerts.length, 1);
  composer.alerts.at(-1)[2].find(button => button.style === "cancel").onPress();
  cancel.props.onClose();
  assert.equal(composer.alerts.length, 2);
  composer.unmount();
  composer.alerts.at(-1)[2].find(button => button.style === "destructive").onPress();
  assert.equal(composer.resets(), 0);
});

test("saving blocks input cancellation even when its handler is called", async () => {
  let finish;
  const pending = new Promise(resolve => { finish = resolve; });
  const composer = mountComposer({}, false, { onSave: () => pending });
  composer.handle.editEntry(existing);
  composer.render();
  const saving = composer.nodes.find(node => node.props.actionLabel === "저장").props.onAction();
  composer.render();
  const cancel = composer.nodes[0];
  assert.equal(composer.nodes.find(node => node.props.actionLabel).props.saving, true);
  cancel.props.onClose();
  composer.render();
  assert.equal(composer.alerts.length, 0);
  assert.equal(composer.nodes.some(node => node.type === "Modal"), false);
  assert.equal(composer.resets(), 0);
  finish(false);
  await saving;
  composer.render();
  assert.equal(composer.nodes[0].props.saving, false);
});

test("failed update retains the editing target and pending fields", async () => {
  const changes = [];
  const composer = mountComposer({}, false, {
    onSave: async () => false, onEntryReviewChange: (editing) => changes.push(editing),
  });
  composer.handle.editEntry(existing);
  composer.render();
  await composer.nodes.find((node) => node.props.actionLabel === "저장").props.onAction();
  composer.render();
  assert.ok(composer.nodes.find((node) => node.props.actionLabel === "저장"));
  assert.deepEqual(changes, [true]);
});

test("deleting the entry being edited clears editing without saving", () => {
  const changes = [];
  const composer = mountComposer({}, false, { onEntryReviewChange: (editing) => changes.push(editing) });
  composer.handle.editEntry(existing);
  composer.render();
  composer.handle.discardDeletedEntry([existing]);
  assert.deepEqual(changes, [true, false]);
  assert.equal(composer.saves(), 0);
});

test("opening an existing entry requires confirmation before replacing unfinished input", () => {
  const composer = mountComposer({ amount: "1000" });
  composer.handle.editEntry(existing);
  assert.equal(composer.writes.length, 0);
  composer.alerts[0][2][1].onPress();
  assert.equal(composer.writes[0].amount, "8500");
});

test("clipboard fills pending fields and advances to category without saving", () => {
  const composer = mountComposer();
  composer.handle.importDraft(imported);
  assert.equal(composer.writes[0].date, imported.date);
  assert.equal(composer.writes[0].amount, imported.amount);
  assert.equal(composer.writes[0].targetMemberId, "self");
  composer.render();
  assert.equal(composer.nodes.filter(node => node.type === "TextInput").length, 3);
  assert.equal(composer.saves(), 0);
});

test("unfinished input is preserved until replacement is explicitly chosen", () => {
  const composer = mountComposer({ amount: "1000" });
  assert.equal(composer.handle.isBusy(), true);
  composer.handle.importDraft(imported);
  assert.equal(composer.writes.length, 0);
  const actions = composer.alerts[0][2];
  assert.equal(actions[0].style, "cancel");
  actions[1].onPress();
  assert.equal(composer.writes.length, 1);
});

test("replacement cannot write into an unmounted book composer", () => {
  const composer = mountComposer({ note: "Keep me" });
  composer.handle.importDraft(imported);
  composer.unmount();
  composer.alerts[0][2][1].onPress();
  assert.equal(composer.writes.length, 0);
});

test("read-only composer rejects clipboard import", () => {
  const composer = mountComposer({}, true);
  composer.handle.importDraft(imported);
  assert.equal(composer.writes.length, 0);
  assert.equal(composer.alerts.length, 0);
});

test("manual input dismisses a pending clipboard suggestion without importing it", () => {
  let dismissed = 0;
  const composer = mountComposer({ amount: "1" }, false, {
    clipboardDraft: imported, onDismissClipboard: () => { dismissed++; },
  });
  assert.equal(dismissed, 0);
  composer.nodes.find((node) => node.props.onChangeText).props.onChangeText("12");
  assert.equal(dismissed, 1);
  assert.equal(composer.writes.length, 0);
});

test("clipboard icon dispatches its paste action without changing input itself", () => {
  let reads = 0;
  const composer = mountComposer({ amount: "1000" }, false, { onReadClipboard: () => { reads++; } });
  composer.nodes.find(node => node.props.accessibilityLabel === "클립보드 내역 확인").props.onPress();
  assert.equal(reads, 1);
  assert.equal(composer.writes.length, 0);
});

test("empty input keeps the clipboard suggestion available", () => {
  let dismissed = 0;
  mountComposer({}, false, {
    clipboardDraft: imported, onDismissClipboard: () => { dismissed++; },
  });
  assert.equal(dismissed, 0);
});

for (const saved of [false, true]) test(`sheet completes only after a successful save (${saved})`, async () => {
  let completed = 0;
  const ui = mountComposer({}, false, { sheet: { visible: true, onClose() {} }, onSave: async () => saved, onComplete: () => completed++ });
  ui.handle.editEntry(existing);
  ui.render();
  await ui.nodes[0].props.header.props.onAction();
  assert.equal(completed, saved ? 1 : 0);
  assert.equal(ui.handle.isSaving(), false);
});

test("native sheet focuses the amount after presentation and respects the input lock", () => {
  for (const disabled of [false, true]) {
    const ui = mountComposer({}, disabled, { sheet: { visible: true, onClose() {} } });
    assert.equal(ui.nodes[0].props.requiresCloseConfirmation, false);
    let focused = 0;
    const form = ui.nodes.find(node => node.props.inputRef);
    form.props.inputRef.current = { focus() { focused++; } };
    ui.nodes[0].props.onShow();
    assert.equal(focused, disabled ? 0 : 1);
    ui.unmount();
  }
});

test("clipboard import focuses content after the sheet is presented and a later normal open focuses amount", () => {
  const sheet = { visible: true, onClose() {} };
  const ui = mountComposer({}, false, { sheet });
  let amountFocus = 0, contentFocus = 0;
  const form = ui.nodes.find(node => node.props.contentInputRef);
  form.props.inputRef.current = { focus() { amountFocus++; }, blur() {} };
  form.props.contentInputRef.current = { focus() { contentFocus++; }, blur() {} };
  ui.handle.importDraft(imported); ui.render();
  assert.equal(contentFocus, 0);
  ui.nodes[0].props.onShow();
  assert.equal(contentFocus, 1); assert.equal(amountFocus, 0);
  sheet.visible = false; ui.render(); ui.flushEffects();
  sheet.visible = true; ui.render();
  ui.nodes[0].props.onShow();
  assert.equal(amountFocus, 1);
  ui.unmount();
});

test("importing into an open sheet focuses content only after replacement is accepted", () => {
  const ui = mountComposer({ amount: "500", content: "Original" });
  let contentFocus = 0;
  ui.nodes.find(node => node.props.contentInputRef).props.contentInputRef.current = {
    focus() { contentFocus++; }, blur() {},
  };
  ui.nodes[0].props.onShow();
  ui.handle.importDraft(imported);
  assert.equal(contentFocus, 0);
  ui.alerts[0][2].find(button => button.style === "cancel").onPress?.();
  assert.equal(contentFocus, 0);
  ui.handle.importDraft(imported);
  ui.alerts[1][2].find(button => button.style === "destructive").onPress();
  assert.equal(contentFocus, 1);
  assert.equal(ui.draft.content, imported.content);
  ui.unmount();
});

test("gesture dismissal waits for discard confirmation, preserves cancelled input, and clears focus when confirmed", () => {
  let focused = 0, blurred = 0, closed = 0;
  const sheet = { visible: true, onClose() { closed++; sheet.visible = false; } };
  const ui = mountComposer(imported, false, { sheet });
  const input = ui.nodes.find(node => node.props.inputRef).props.inputRef;
  input.current = { focus() { focused++; }, blur() { blurred++; } };
  const lateShow = ui.nodes[0].props.onShow;
  lateShow(); assert.equal(focused, 1);
  ui.nodes[0].props.onClose();
  assert.equal(closed, 0);
  assert.equal(blurred, 0);
  ui.alerts[0][2].find(button => button.style === 'cancel').onPress();
  assert.equal(ui.draft.amount, '8500');
  ui.nodes[0].props.onClose();
  ui.alerts[1][2].find(button => button.style === 'destructive').onPress();
  assert.equal(blurred, 1);
  assert.equal(closed, 1);
  lateShow(); assert.equal(focused, 1);
  ui.render(); ui.flushEffects();
  lateShow(); assert.equal(focused, 1);
  assert.equal(ui.draft.amount, '');
  sheet.visible = true;
  ui.render(); ui.flushEffects();
  assert.equal(focused, 1);
  ui.nodes[0].props.onShow();
  assert.equal(focused, 2);
  assert.equal(ui.resets(), 1);
  ui.unmount();
});

test("sheet content does not render a clipboard detection preview", () => {
  const ui = mountComposer({}, false, { sheet: { visible: true, onClose() {} },
    clipboardDraft: imported, onApplyClipboard() {}, onDismissClipboard() {} });
  assert.equal(ui.nodes.some(node => node.props.draft === imported && node.props.onApply), false);
  ui.unmount();
});

test("external visibility changes preserve the editing draft for sheet handoffs", () => {
  const sheet = { visible: false, onClose() {} };
  const ui = mountComposer({}, false, { sheet });
  ui.handle.editEntry(existing);
  sheet.visible = true;
  ui.render();
  assert.equal(ui.nodes[0].props.visible, true);
  assert.equal(ui.draft.amount, "8500");
  sheet.visible = false;
  ui.render();
  assert.equal(ui.nodes[0].props.visible, false);
  assert.equal(ui.handle.isBusy(), true);
  sheet.visible = true;
  ui.render();
  assert.equal(ui.draft.amount, "8500");
  assert.equal(ui.nodes[0].props.header.props.actionLabel, "저장");
  assert.equal(ui.resets(), 0);
});

test("header close dismisses an empty draft immediately but asks before discarding entered values", () => {
  let closed = 0;
  const sheet = { visible: true, onClose: () => closed++ };
  const empty = mountComposer({}, false, { sheet });
  empty.nodes[0].props.header.props.onClose();
  assert.equal(closed, 1);
  assert.equal(empty.alerts.length, 0);
  const ui = mountComposer(imported, false, { sheet });
  assert.equal(ui.nodes[0].props.requiresCloseConfirmation, true);
  const original = ui.draft;
  const close = () => ui.nodes[0].props.header.props.onClose();
  close(); close();
  assert.equal(closed, 1);
  assert.equal(ui.alerts.length, 1);
  ui.alerts[0][2].find(button => button.style === 'cancel').onPress();
  ui.render();
  assert.equal(ui.draft, original);
  assert.equal(ui.resets(), 0);
  close();
  const discard = ui.alerts[1][2].find(button => button.style === 'destructive');
  discard.onPress(); discard.onPress();
  ui.render();
  assert.equal(ui.resets(), 1);
  assert.equal(ui.draft.amount, '');
  assert.equal(ui.saves(), 0);
  assert.equal(closed, 2);
});

test("header close can discard unavailable input but cannot dismiss during save or after unmount", async () => {
  let closed = 0, finish;
  const sheet = { visible: true, onClose: () => closed++ };
  const unavailable = mountComposer(imported, true, { sheet });
  unavailable.nodes[0].props.header.props.onClose();
  unavailable.alerts[0][2].find(button => button.style === 'destructive').onPress();
  assert.equal(closed, 1);
  assert.equal(unavailable.resets(), 1);
  const ui = mountComposer({}, false, { sheet, onSave: () => new Promise(resolve => { finish = resolve; }) });
  ui.handle.editEntry(existing); ui.render();
  ui.draft.content = 'Changed'; ui.render();
  const saving = ui.nodes[0].props.header.props.onAction();
  ui.nodes[0].props.header.props.onClose();
  assert.equal(ui.alerts.length, 0);
  assert.equal(closed, 1);
  finish(false); await saving; ui.render();
  ui.nodes[0].props.header.props.onClose();
  const discard = ui.alerts[0][2].find(button => button.style === 'destructive');
  ui.unmount(); discard.onPress();
  assert.equal(ui.resets(), 0);
  assert.equal(closed, 1);
});
