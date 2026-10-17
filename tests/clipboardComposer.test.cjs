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
      Pressable: "Pressable", View: "View", Modal: "Modal", Text: "Text",
      StyleSheet: { create: (styles) => styles }, Keyboard: { dismiss() {} },
      Alert: { alert: (...args) => alerts.push(args) },
    },
    "../../hooks/useEntryComposer": { useEntryComposer: () => ({
      draft, update() {}, members: [{ userId: "self", displayName: "Me" }],
      setDraft: (value) => { writes.push(value); draft = value; },
      reset() {
        resets++;
        draft = load(path.join(__dirname, "../src/utils/ledgerEntries.ts")).createDraft("2026-09-01", "self");
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
      if (name === "./EntryCancelButton" || name === "./EntryDiscardModal") return load(path.resolve(path.dirname(file), `${name}.tsx`));
      if (name.includes("/constants/") || name.includes("/utils/") || name === "./amount" || name === "./currency") return load(path.resolve(path.dirname(file), `${name}.ts`));
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
    if (typeof node.type === "function" && ["EntryCancelButton", "EntryDiscardModal"].includes(node.type.name)) {
      visit(node.type(node.props));
    }
    visit(node.props.children);
  }
  function render() {
    stateIndex = 0;
    refIndex = 0;
    nodes.length = 0;
    visit(EntryComposer({ availableHeight: 800, userId: "self", disabled, onSave: () => { saves++; }, ...props }));
  }
  render();
  const cleanups = effects.map((effect) => effect()).filter(Boolean);
  return { get handle() { return handle; }, get draft() { return draft; }, resets: () => resets, render, writes, alerts, states, nodes, saves: () => saves, unmount: () => cleanups.forEach((cleanup) => cleanup()) };
}

const imported = { date: "2026-09-01", amount: "8500", content: "Lunch", type: "expense", categoryId: "", note: "", photoAttachments: [] };
const existing = { ...imported, id: "existing-entry", amount: 8500, categoryId: "food", category: "Food", targetMemberId: "other", installmentMonths: 3 };

test("disabled empty composer uses the placeholder without an external notice", () => {
  const ui = mountComposer({}, true);
  const input = ui.nodes.find((node) => node.props.onChangeText);
  assert.equal(input.props.placeholder, "현재 가계부에는 기록할 수 없어요.");
  assert.equal(input.props.editable, false);
  assert.equal(input.props.value, "");
  assert.equal(ui.nodes.some((node) => node.props.children === input.props.placeholder), false);
  assert.equal(ui.nodes.find((node) => node.props.label === "다음").props.disabled, true);
});

test("disabling amount, content or note preserves input and places the notice inside its field", () => {
  for (const field of ["amount", "content", "note"]) {
    const props = { disabled: false, onReadClipboard: () => {} };
    const ui = mountComposer(field === "note" ? {} : { ...imported, note: "keep memo" }, false, props);
    if (field === "content") {
      ui.nodes.find((node) => node.props.label === "다음").props.onPress();
      ui.render();
    } else if (field === "note") {
      ui.handle.editEntry({ ...existing, note: "keep memo" });
      ui.render();
      ui.nodes.find((node) => node.props.label === "메모 수정").props.onPress();
      ui.render();
    }
    const original = ui.nodes.find((node) => node.props.onChangeText).props.value;
    props.disabled = true;
    ui.render();
    const input = ui.nodes.find((node) => node.props.onChangeText);
    assert.equal(input.props.value, original);
    assert.equal(input.props.editable, false);
    const notice = ui.nodes.find((node) => node.props.children === "현재 가계부에는 기록할 수 없어요.");
    const fieldContainer = ui.nodes.find((node) => Array.isArray(node.props.children) && node.props.children.includes(notice));
    assert.ok(Array.isArray(fieldContainer.props.style));
    for (const icon of ["clipboard", "x-circle"]) {
      assert.equal(ui.nodes.find((node) => node.props.icon === icon).props.disabled, true);
    }
    props.disabled = false;
    ui.render();
    assert.equal(ui.nodes.find((node) => node.props.onChangeText).props.value, original);
    assert.equal(ui.nodes.find((node) => node.props.onChangeText).props.editable, true);
    assert.equal(ui.nodes.some((node) => node.props.children === "현재 가계부에는 기록할 수 없어요."), false);
  }
});

test("disabled review replaces the save action with an unavailable field", () => {
  const props = { disabled: false };
  const ui = mountComposer({}, false, props);
  ui.handle.editEntry(existing);
  ui.render();
  props.disabled = true;
  ui.render();
  assert.equal(ui.nodes.some((node) => node.props.label === "저장"), false);
  const notice = ui.nodes.find((node) => node.props.children === "현재 가계부에는 기록할 수 없어요.");
  assert.ok(ui.nodes.some((node) => node.props.children === notice && node.props.accessibilityState?.disabled));
  assert.equal(ui.writes[0].amount, "8500");
  assert.equal(ui.saves(), 0);
});

test("editing preserves the original identity and member and saves as an update", async () => {
  let saved;
  const composer = mountComposer({}, false, { onSave: async (...args) => { saved = args; return true; } });
  composer.handle.editEntry(existing);
  assert.equal(composer.writes[0].targetMemberId, "other");
  assert.equal(composer.writes[0].installmentMonths, 3);
  assert.equal(saved, undefined);
  composer.render();
  await composer.nodes.find((node) => node.props.label === "저장").props.onPress();
  assert.equal(saved[1].id, existing.id);
  assert.equal(saved[0].date, existing.date);
});

test("canceling editing never saves and returns to new entry mode", () => {
  const changes = [];
  const composer = mountComposer({}, false, { onEditingChange: (editing) => changes.push(editing) });
  composer.handle.editEntry(existing);
  composer.render();
  composer.nodes.find((node) => node.props.accessibilityLabel === "입력 취소").props.onPress();
  composer.render();
  assert.equal(composer.nodes.find((node) => node.type === "Modal").props.visible, true);
  assert.equal(composer.resets(), 0);
  composer.nodes.find((node) => node.props.label === "폐기").props.onPress();
  composer.render();
  assert.deepEqual(changes, [true, false]);
  assert.equal(composer.saves(), 0);
  assert.equal(composer.resets(), 1);
  assert.equal(composer.draft.amount, "");
  assert.equal(composer.draft.content, "");
  assert.equal(composer.nodes.find((node) => node.type === "Modal").props.visible, false);
  assert.equal(composer.nodes.find((node) => node.props.onChangeText).props.value, "");
  assert.equal(composer.handle.isBusy(), false);
});

test("discarding a new imported draft clears input without saving", () => {
  const composer = mountComposer();
  composer.handle.importDraft(imported);
  composer.render();
  composer.nodes.find(node => node.props.accessibilityLabel === "입력 취소").props.onPress();
  composer.render();
  composer.nodes.find(node => node.props.label === "폐기").props.onPress();
  composer.render();
  assert.equal(composer.resets(), 1);
  assert.equal(composer.saves(), 0);
  assert.equal(composer.handle.isBusy(), false);
  assert.equal(composer.draft.amount, "");
  assert.equal(composer.draft.content, "");
});

for (const dismiss of ["continue", "systemBack"]) test(`dismiss discard confirmation via ${dismiss} preserves editing and input`, () => {
  const changes = [];
  const composer = mountComposer({}, false, { onEditingChange: value => changes.push(value) });
  composer.handle.editEntry(existing);
  composer.render();
  const before = composer.draft;
  composer.nodes.find(node => node.props.accessibilityLabel === "입력 취소").props.onPress();
  composer.render();
  if (dismiss === "continue") composer.nodes.find(node => node.props.label === "계속 작성").props.onPress();
  else composer.nodes.find(node => node.type === "Modal").props.onRequestClose();
  composer.render();
  assert.equal(composer.nodes.find(node => node.type === "Modal").props.visible, false);
  assert.equal(composer.draft, before);
  assert.equal(composer.resets(), 0);
  assert.equal(composer.saves(), 0);
  assert.deepEqual(changes, [true]);
});

test("saving blocks input cancellation even when its handler is called", async () => {
  let finish;
  const pending = new Promise(resolve => { finish = resolve; });
  const composer = mountComposer({}, false, { onSave: () => pending });
  composer.handle.editEntry(existing);
  composer.render();
  const saving = composer.nodes.find(node => node.props.label === "저장").props.onPress();
  composer.render();
  const cancel = composer.nodes.find(node => node.props.accessibilityLabel === "입력 취소");
  assert.equal(cancel.props.disabled, true);
  cancel.props.onPress();
  composer.render();
  assert.equal(composer.nodes.find(node => node.type === "Modal").props.visible, false);
  assert.equal(composer.resets(), 0);
  finish(false);
  await saving;
  composer.render();
  assert.equal(composer.nodes.find(node => node.props.accessibilityLabel === "입력 취소").props.disabled, false);
});

test("failed update retains the editing target and pending fields", async () => {
  const changes = [];
  const composer = mountComposer({}, false, {
    onSave: async () => false, onEditingChange: (editing) => changes.push(editing),
  });
  composer.handle.editEntry(existing);
  composer.render();
  await composer.nodes.find((node) => node.props.label === "저장").props.onPress();
  composer.render();
  assert.ok(composer.nodes.find((node) => node.props.label === "저장"));
  assert.deepEqual(changes, [true]);
});

test("deleting the entry being edited clears editing without saving", () => {
  const changes = [];
  const composer = mountComposer({}, false, { onEditingChange: (editing) => changes.push(editing) });
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
  assert.ok(composer.states.includes("category"));
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

test("clipboard icon requests a preview without replacing existing input", () => {
  let reads = 0;
  const composer = mountComposer({ amount: "1000" }, false, { onReadClipboard: () => { reads++; } });
  composer.nodes.find((node) => node.props.icon === "clipboard").props.onPress();
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
