const assert = require("node:assert/strict");
const test = require("node:test");
const { modules, hooks } = require("./annualReportHelpers.cjs");
test("create action registers plus in the sheet header, tracks current handler and disabled state, and cleans up", () => {
  const h = hooks();
  let action,
    created = 0;
  const register = (next) => {
    action = next;
  };
  const load = modules({
    react: { ...h.react, createContext: () => ({}), useContext: () => register },
  });
  const { useRegisterLedgerBookCreateAction } = load(
    "src/components/sharedLedgerPanel/ledgerBookManagementHeader.ts",
  );
  const render = (increment, disabled = false) =>
    h.render(() => useRegisterLedgerBookCreateAction(() => (created += increment), disabled));
  assert.equal(render(1), true);
  assert.equal(action.icon, "plus");
  assert.equal(action.disabled, false);
  action.onPress();
  assert.equal(created, 1);
  const originalAction = action;
  render(2);
  assert.equal(action, originalAction);
  action.onPress();
  assert.equal(created, 3);
  render(2, true);
  assert.equal(action.disabled, true);
  h.unmount();
  assert.equal(action, undefined);
});
