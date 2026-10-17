const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

function mount(editing = false, onConvert) {
  const states = [], updates = [];
  let stateIndex = 0;
  const jsx = (type, props) => ({ type, props });
  const mocks = {
    react: { useState: (initial) => {
      const index = stateIndex++;
      if (!(index in states)) states[index] = initial;
      return [states[index], (next) => { states[index] = next; }];
    } },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": { View: "View", Text: "Text", StyleSheet: { create: (styles) => styles } },
    "../../lib/installments": { formatInstallmentLabel: (months) => months === 1 ? "일시불" : `${months}개월` },
  };
  function load(file) {
    if (file.endsWith(".json")) return JSON.parse(fs.readFileSync(file, "utf8"));
    const exports = {};
    const { outputText } = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX },
    });
    vm.runInNewContext(outputText, { exports, require: (name) => {
      if (name in mocks) return mocks[name];
      if (name.includes("constants/") || name.endsWith(".json")) {
        return load(path.resolve(path.dirname(file), name.endsWith(".json") ? name : `${name}.ts`));
      }
      return new Proxy({}, { get: (_, key) => key });
    } });
    return exports;
  }
  const { EntryComposerDetails } = load(path.join(__dirname, "../src/components/entryComposer/EntryComposerDetails.tsx"));
  const draft = { date: "2026-10-12", installmentMonths: 1, targetMemberId: "self", photoAttachments: [] };
  const nodes = [];
  const visit = (node) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node?.props) return;
    nodes.push(node);
    visit(node.props.children);
  };
  const render = () => {
    nodes.length = 0;
    stateIndex = 0;
    visit(EntryComposerDetails({ editing, onConvert, composer: {
      draft, members: [{ userId: "self" }, { userId: "other" }], pickPhotos: async () => {},
      update: (field, value) => { updates.push([field, value]); draft[field] = value; },
    } }));
  };
  render();
  return { nodes, updates, render };
}

test("new entry payment selector opens and changes installment months in the draft", () => {
  const ui = mount();
  ui.nodes.find((node) => node.type === "EntryInstallmentSelector").props.onPress();
  ui.render();
  const picker = ui.nodes.find((node) => node.type === "InstallmentPickerModal");
  assert.equal(picker.props.isOpen, true);
  picker.props.onSelectInstallmentMonths(3);
  ui.render();
  assert.equal(ui.nodes.find((node) => node.type === "EntryInstallmentSelector").props.installmentMonths, 3);
  assert.deepEqual(ui.updates, [["installmentMonths", 3]]);
});

test("details member change retains identity and updates member display name together", () => {
  const ui = mount();
  ui.nodes.find((node) => node.type === "EntryTargetMemberSelector").props.onSelectMember({ userId: "other", displayName: "다른 구성원" });
  assert.deepEqual(ui.updates, [["targetMemberId", "other"], ["targetMemberName", "다른 구성원"]]);
});

test("saved installment opens explicit conversion without mutating draft months", () => {
  let opened = false;
  const ui = mount(true, () => { opened = true; });
  assert.equal(ui.nodes.some((node) => node.type === "EntryInstallmentSelector"), false);
  ui.nodes.find((node) => node.type === "ActionButton").props.onPress();
  assert.equal(opened, true);
  assert.deepEqual(ui.updates, []);
});

