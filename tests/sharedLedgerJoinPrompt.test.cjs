const assert = require("node:assert/strict");
const test = require("node:test");
const { modules } = require("./annualReportHelpers.cjs");
const jsx = (type, props) => ({ type, props });

function setup(onJoin) {
  const prompts = [],
    drafts = [];
  const load = modules({
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": {
      Alert: { prompt: (...args) => prompts.push(args) },
      Text: "Text",
      View: "View",
      StyleSheet: { create: (styles) => styles },
    },
    "@expo/vector-icons": { Feather: "Icon" },
    "src/components/ActionButton.tsx": { ActionButton: "Button" },
    "src/components/sharedLedgerPanel/sharedLedgerPanelStyles.ts": {
      getSharedLedgerPanelStyles: () => ({}),
    },
  });
  const { SharedLedgerJoinCard } = load(
    "src/components/sharedLedgerPanel/SharedLedgerJoinCard.tsx",
  );
  const { AppMessages } = load("src/constants/messages.ts");
  const tree = SharedLedgerJoinCard({
    shareCodeInput: "OLD",
    onChangeShareCodeInput: (value) => drafts.push(value),
    onJoin,
  });
  const button = tree.props.children.find((node) => node.type === "Button");
  assert.equal(button.props.label, AppMessages.accountJoinTitle);
  return { button, prompts, drafts };
}

test("the native prompt forwards the newly confirmed code and keeps the action pending until the request finishes", async () => {
  let finish;
  const joined = [];
  const { button, prompts, drafts } = setup((code) => {
    joined.push(code);
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  const pending = button.props.onPress();
  let settled = false;
  pending.then(() => {
    settled = true;
  });
  assert.equal(prompts[0][4], "OLD");
  const confirmation = prompts[0][2][1].onPress("NEW");
  assert.deepEqual(joined, ["NEW"]);
  assert.deepEqual(drafts, ["NEW"]);
  assert.equal(settled, false);
  finish();
  await confirmation;
  await pending;
  assert.equal(settled, true);
});

test("cancelling the native prompt preserves the draft and never submits a join request", async () => {
  const joined = [];
  const { button, prompts, drafts } = setup((code) => joined.push(code));
  const pending = button.props.onPress();
  prompts[0][2][0].onPress();
  await pending;
  assert.deepEqual(joined, []);
  assert.deepEqual(drafts, []);
});
