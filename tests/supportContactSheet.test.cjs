const assert = require("node:assert/strict");
const test = require("node:test");
const { modules, hooks } = require("./annualReportHelpers.cjs");

test("draft dismissal preserves input on cancellation, blocks while busy, and dispatches only confirmed removal", () => {
  const h = hooks(),
    alerts = [],
    dispatched = [];
  let prevent, callback;
  const load = modules({
    react: h.react,
    "react-native": { Alert: { alert: (...args) => alerts.push(args) } },
    "@react-navigation/native": {
      useNavigation: () => ({ dispatch: (action) => dispatched.push(action) }),
      usePreventRemove: (blocked, handler) => {
        prevent = blocked;
        callback = handler;
      },
    },
  });
  const { useSupportContactDismiss } = load("src/hooks/useSupportContactDismiss.ts");
  const render = (dirty, busy) => h.render(() => useSupportContactDismiss(dirty, busy));
  const removal = { data: { action: { type: "GO_BACK" } } };
  render(false, false);
  assert.equal(prevent, false);
  render(true, false);
  assert.equal(prevent, true);
  callback(removal);
  callback(removal);
  assert.equal(alerts.length, 1);
  alerts[0][2].find((button) => button.style === "cancel").onPress();
  assert.equal(dispatched.length, 0);
  callback(removal);
  alerts[1][2].find((button) => button.style === "destructive").onPress();
  assert.equal(dispatched[0], removal.data.action);
  render(true, true);
  callback(removal);
  assert.equal(alerts.length, 2);
  h.unmount();
});

test("support draft validates fields, prevents duplicate native operations and retains input after mail cancellation or failure", async () => {
  const h = hooks(),
    messages = [],
    sends = [],
    checks = [];
  let resolvePick, resolveMail, rejectMail;
  const load = modules({
    react: h.react,
    "src/hooks/useSupportContactDismiss.ts": {
      useSupportContactDismiss: (dirty, busy) => checks.push({ dirty, busy }),
    },
    "src/lib/nativeToast.ts": { showNativeToast: (message) => messages.push(message) },
    "src/lib/supportContact.ts": {
      pickSupportAttachments: () =>
        new Promise((resolve) => {
          resolvePick = resolve;
        }),
      composeSupportMail: (data) => {
        sends.push(data);
        return new Promise((resolve, reject) => {
          resolveMail = resolve;
          rejectMail = reject;
        });
      },
    },
  });
  const { useSupportContactDraft } = load("src/hooks/useSupportContactDraft.ts");
  const render = () => h.render(() => useSupportContactDraft("me@example.com"));
  let draft = render();
  await draft.handleSendSupportMail();
  assert.equal(messages.length, 1);
  assert.equal(sends.length, 0);
  draft.setSubject(" Subject ");
  draft.setMessageBody(" Body ");
  draft = render();
  assert.equal(checks.at(-1).dirty, true);
  const picking = draft.handlePickAttachments();
  assert.equal(render().isBusy, true);
  await render().handleSendSupportMail();
  assert.equal(sends.length, 0);
  resolvePick([{ uri: "photo", fileName: "photo.jpg" }]);
  await picking;
  draft = render();
  const sending = draft.handleSendSupportMail();
  await render().handleSendSupportMail();
  assert.equal(sends.length, 1);
  assert.equal(sends[0].subject, "Subject");
  assert.equal(sends[0].body, "Body");
  assert.equal(sends[0].attachments.length, 1);
  resolveMail();
  await sending;
  draft = render();
  assert.equal(draft.subject, " Subject ");
  assert.equal(draft.messageBody, " Body ");
  assert.equal(draft.attachments.length, 1);
  const failed = draft.handleSendSupportMail();
  rejectMail(new Error("mail unavailable"));
  await failed;
  assert.equal(render().isBusy, false);
  assert.equal(render().attachments.length, 1);
  render().removeAttachment("photo");
  assert.equal(render().attachments.length, 0);
  h.unmount();
});

test("sheet send action uses the latest draft, is disabled for incomplete or busy forms, and does not reinstall on every keystroke", () => {
  const h = hooks(),
    options = [],
    sent = [];
  const navigation = { setOptions: (value) => options.push(value) };
  const jsx = (type, props) => ({ type, props });
  const load = modules({
    react: { ...h.react, useLayoutEffect: h.react.useEffect },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "@react-navigation/native": { useNavigation: () => navigation },
    "src/components/IconActionButton.tsx": { IconActionButton: "Icon" },
  });
  const { useSupportContactHeader } = load("src/hooks/useSupportContactHeader.ts");
  const render = (draft, enabled) =>
    h.render(() =>
      useSupportContactHeader(async () => {
        sent.push(draft);
      }, enabled),
    );
  render("", false);
  let button = options.at(-1).unstable_headerRightItems()[0];
  assert.equal(button.disabled, true);
  button.onPress();
  assert.equal(sent.length, 0);
  render("first", true);
  button = options.at(-1).unstable_headerRightItems()[0];
  assert.equal(button.disabled, false);
  assert.equal(button.icon.name, "checkmark");
  const registrations = options.length;
  render("updated", true);
  assert.equal(options.length, registrations);
  button.onPress();
  assert.deepEqual(sent, ["updated"]);
  render("updated", false);
  button.onPress();
  assert.deepEqual(sent, ["updated"]);
  assert.equal(options.at(-1).unstable_headerRightItems()[0].disabled, true);
  h.unmount();
});
