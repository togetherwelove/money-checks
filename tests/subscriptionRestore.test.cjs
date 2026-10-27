const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");
const root = path.join(__dirname, "..");

function evaluate(source, mocks = {}, globals = {}) {
  const exports = {};
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  });
  vm.runInNewContext(outputText, {
    exports, process: { env: {} }, ...globals,
    require: (name) => mocks[name] ?? new Proxy({}, { get: (_, key) => key === "__esModule" ? true : key }),
  });
  return exports;
}
const { SubscriptionMessages, SubscriptionTiers } = evaluate(fs.readFileSync(path.join(root, "src/constants/subscription.ts"), "utf8"));

test('paywall shows renewal disclosures and restore without expanding, and never advertises a fallback price', () => {
  const jsx = (type, props) => ({ type, props });
  const { SubscriptionScreen } = evaluate(fs.readFileSync(path.join(root, "src/screens/SubscriptionScreen.tsx"), "utf8"), {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": { View: "View", Text: "Text", StyleSheet: { create: value => value } },
    "../constants/subscription": { SubscriptionMessages, SubscriptionHeroUi: {} },
    "../constants/menuStyles": { MenuStyles: { sections: { gap: 0 } } },
  });
  function flatten(node) {
    if (Array.isArray(node)) return node.flatMap(flatten);
    if (!node?.props) return [];
    return [node, ...flatten(node.props.children)];
  }
  let restored = 0;
  const props = { hasAvailablePlusPackage: true, isPlusActive: false,
    onPurchasePlus: async () => {}, onRestorePurchases: async () => { restored++; }, plusPriceLabel: '₩1,000/월' };
  const nodes = flatten(SubscriptionScreen(props));
  assert.ok(nodes.some(node => node.props.children === SubscriptionMessages.renewalNotice));
  assert.ok(nodes.some(node => node.props.children === SubscriptionMessages.purchaseInfoDefaultPeriodValue));
  nodes.find(node => node.props.label === SubscriptionMessages.restoreAction).props.onPress();
  assert.equal(restored, 1);
  const unavailable = flatten(SubscriptionScreen({ ...props, plusPriceLabel: null }));
  assert.equal(unavailable.some(node => node.props.label === SubscriptionMessages.purchaseAction), false);
  assert.equal(unavailable.some(node => node.props.children === SubscriptionMessages.heroPriceLabel), false);
});

for (const tier of [SubscriptionTiers.free, SubscriptionTiers.plus]) {
  test(`account ${tier} always exposes restore and keeps Plus management`, () => {
    const jsx = (type, props) => ({ type, props });
    let restored = 0, managed = 0;
    const { AccountScreen } = evaluate(fs.readFileSync(path.join(root, "src/screens/AccountScreen.tsx"), "utf8"), {
      react: { useEffect: () => {}, useState: (initial) => [initial, () => {}] },
      "react/jsx-runtime": { jsx, jsxs: jsx },
      "react-native": { View: "View", Text: "Text", ScrollView: "ScrollView", StyleSheet: { create: (styles) => styles } },
      "../constants/subscription": { SubscriptionMessages, SubscriptionTiers },
      "../constants/messages": { AppMessages: {} },
      "../constants/keyboard": { KeyboardLayout: {} },
      "../constants/layout": { AppLayout: {} },
      "../constants/colors": { AppColors: {} },
      "../constants/menuStyles": { MenuStyles: { sections: { gap: 0 } } },
    });
    const nodes = [];
    const visit = (node) => {
      if (Array.isArray(node)) return node.forEach(visit);
      if (!node?.props) return;
      nodes.push(node);
      visit(node.props.children);
      visit(node.props.action);
    };
    visit(AccountScreen({ subscriptionTier: tier, onRestorePurchases: async () => { restored++; }, onOpenSubscriptionManagement: async () => { managed++; } }));
    const restoreButtons = nodes.filter((node) => node.props.label === SubscriptionMessages.restoreAction);
    assert.equal(restoreButtons.length, 1);
    restoreButtons[0].props.onPress();
    assert.equal(restored, 1);
    const manage = nodes.find((node) => node.props.label === SubscriptionMessages.manageAction);
    assert.equal(Boolean(manage), tier === SubscriptionTiers.plus);
    if (manage) { manage.props.onPress(); assert.equal(managed, 1); }
  });
}

// Execute the application's actual handler, preserving its result and error branching.
const app = ts.createSourceFile("App.tsx", fs.readFileSync(path.join(root, "src/App.tsx"), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let restoreInitializer;
function find(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(app) === "handleRestorePurchases") restoreInitializer = node.initializer.getText(app);
  ts.forEachChild(node, find);
}
find(app);
assert.ok(restoreInitializer);
for (const result of ["plus", "free", "error"]) {
  test(`restore ${result} displays the corresponding outcome`, async () => {
    const messages = [], errors = [];
    let calls = 0;
    const { run } = evaluate(`export const run = ${restoreInitializer};`, {}, {
      SubscriptionMessages, SubscriptionTiers,
      subscription: { restorePurchases: async () => { calls++; if (result === "error") throw new Error("offline"); return result; } },
      trackBlockingTask: (task) => task(),
      showNativeToast: (message) => messages.push(message),
      logAppError: (...args) => errors.push(args), session: { user: { id: "test-user" } },
    });
    await run();
    assert.equal(calls, 1);
    assert.deepEqual(messages, [result === "plus" ? SubscriptionMessages.restoreSuccess : result === "free" ? SubscriptionMessages.inactiveRestoreMessage : SubscriptionMessages.restoreError]);
    assert.equal(errors.length, result === "error" ? 1 : 0);
  });
}
