const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

function load(file, mocks = {}, globals = {}) {
  const exports = {};
  const { outputText } = ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  vm.runInNewContext(outputText, {
    exports, Request, Response, console, ...globals,
    require: (name) => {
      if (name in mocks) return mocks[name];
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return exports;
}

test("entry subscription refreshes on connection and resume, and releases resources", () => {
  let stateChanged, statusChanged, removedListener = 0, removedChannel = 0, refreshes = 0;
  const channel = { on: () => channel, subscribe: (callback) => { statusChanged = callback; return channel; } };
  const { subscribeToLedgerEntryChanges } = load("src/lib/ledgerEntryRealtime.ts", {
    "react-native": { AppState: { currentState: "active", addEventListener: (_, callback) => {
      stateChanged = callback;
      return { remove: () => removedListener++ };
    } } },
    "../constants/ledgerQueries": load("src/constants/ledgerQueries.ts"),
    "./supabase": { supabase: { channel: () => channel, removeChannel: () => removedChannel++ } },
  });
  const dispose = subscribeToLedgerEntryChanges({ bookId: "book", channelScope: "calendar", onChange: () => {}, onResync: () => refreshes++ });
  statusChanged("SUBSCRIBED");
  stateChanged("active");
  stateChanged("background");
  stateChanged("active");
  statusChanged("CHANNEL_ERROR");
  statusChanged("SUBSCRIBED");
  assert.equal(refreshes, 3);
  dispose();
  statusChanged("SUBSCRIBED");
  stateChanged("background");
  stateChanged("active");
  assert.equal(refreshes, 3);
  assert.equal(removedListener, 1);
  assert.equal(removedChannel, 1);
});

test("threshold, widget and individual notification failures do not suppress other entries", async () => {
  const { sendEntrySaveNotifications } = load("src/lib/notifications/entrySaveNotifications.ts");
  const sent = [], errors = [];
  await sendEntrySaveNotifications({
    entries: ["first", "second"],
    notifyThreshold: async () => { throw new Error("threshold failed"); },
    loadWidget: async () => { throw new Error("widget failed"); },
    notifyMember: async (entry, widget) => {
      assert.equal(widget, undefined);
      sent.push(entry);
      if (entry === "first") throw new Error("first failed");
    },
    onError: (_, step) => errors.push(step),
  });
  assert.deepEqual(sent, ["first", "second"]);
  assert.deepEqual(errors, ["notify_expense_threshold", "load_notification_widget_summary", "notify_shared_entry"]);
});

test("notification orchestration loads widget once and skips member work on edits", async () => {
  const { sendEntrySaveNotifications } = load("src/lib/notifications/entrySaveNotifications.ts");
  let widgets = 0, sends = 0, thresholds = 0;
  const widget = { monthKey: "2026-10" };
  const options = {
    entries: ["first", "second"],
    notifyThreshold: async () => { thresholds++; },
    loadWidget: async () => { widgets++; return widget; },
    notifyMember: async (_, received) => { assert.equal(received, widget); sends++; },
    onError: (error) => { throw error; },
  };
  await sendEntrySaveNotifications(options);
  await sendEntrySaveNotifications({ ...options, entries: [] });
  assert.deepEqual([widgets, sends, thresholds], [1, 2, 2]);
});

function mountNotifications(push) {
  const effects = [], states = [], listeners = [];
  let removed = 0;
  const { useLedgerNotifications } = load("src/hooks/useLedgerNotifications.ts", {
    react: {
      useState: (initial) => { const index = states.length; states.push(initial); return [initial, (value) => { states[index] = value; }]; },
      useEffect: (effect) => effects.push(effect), useCallback: (callback) => callback,
    },
    "react-native": { AppState: { addEventListener: (_, callback) => { listeners.push(callback); return { remove: () => removed++ }; } } },
    "../lib/logAppError": { logAppError: () => {} },
    "../lib/notifications/pushNotificationDispatch": {},
    "../lib/notifications/pushNotifications": push,
    "../notifications/application/expenseThresholds": {},
    "../notifications/config/notificationCopy": {},
    "../notifications/config/pushNotificationCopy": { PushNotificationCopy: { registrationFailed: "registration failed" } },
    "../notifications/domain/notificationEventFactories": {},
    "../utils/ledgerEntries": {},
    "./useNotificationPreferences": { useNotificationPreferences: () => ({}) },
  });
  const hook = useLedgerNotifications("user");
  return { hook, effects, states, listeners, removed: () => removed };
}

test("failed permission request returns failure and preserves actual permission", async () => {
  for (const actualPermission of ["denied", "granted"]) {
    const instance = mountNotifications({
      requestPushNotificationPermission: async () => { throw new Error("registration failed"); },
      readPushNotificationPermission: async () => actualPermission,
    });
    assert.equal(await instance.hook.requestNotifications(), false);
    assert.deepEqual(instance.states, [actualPermission, "registration failed"]);
  }
});

test("foreground retries failed token sync and rechecks changed OS permission", async () => {
  let permission = "denied", registrations = 0;
  const instance = mountNotifications({
    readPushNotificationPermission: async () => permission,
    syncPushRegistration: async () => { if (++registrations === 1) throw new Error("offline"); },
  });
  const dispose = instance.effects[0]();
  await new Promise(setImmediate);
  assert.equal(registrations, 0);
  permission = "granted";
  instance.listeners[0]("active");
  await new Promise(setImmediate);
  assert.deepEqual(instance.states, ["granted", "registration failed"]);
  instance.listeners[0]("active");
  await new Promise(setImmediate);
  assert.equal(registrations, 2);
  assert.deepEqual(instance.states, ["granted", null]);
  dispose();
  assert.equal(instance.removed(), 1);
});

test("server allows consecutive distinct entries while limiting duplicate sends", async () => {
  const locks = new Set();
  const delivered = [];
  const { handleSendPushNotificationsRequest } = load("supabase/functions/send-push-notifications/sendPushNotificationsHandler.ts", {
    "../_shared/i18n/translate.ts": { translate: (_, key) => key },
    "./expoPushTickets.ts": load("supabase/functions/send-push-notifications/expoPushTickets.ts"),
  }, {
    fetch: async (_, options) => {
      delivered.push(...JSON.parse(options.body));
      return new Response(JSON.stringify({ data: [{ status: "ok", id: "ticket" }] }));
    },
  });
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: "sender" } }, error: null }) },
    rpc: async (_, { target_function_name }) => {
      const acquired = !locks.has(target_function_name);
      locks.add(target_function_name);
      return { data: acquired, error: null };
    },
    from: (table) => {
      const rows = table === "ledger_book_members"
        ? [{ user_id: "recipient", role: "editor" }]
        : table === "push_device_tokens" ? [{ expo_push_token: "ExpoPushToken[test]" }] : [];
      const query = {
        select: () => query, eq: () => query, in: () => query,
        maybeSingle: async () => ({ data: table === "ledger_book_members" ? { role: "editor" } : null, error: null }),
        then: (resolve) => resolve({ data: rows, error: null }),
      };
      return query;
    },
  };
  const send = (entryId, type = "other_member_created_entry") => handleSendPushNotificationsRequest(new Request("https://test.invalid", {
    method: "POST", headers: { Authorization: "Bearer test" },
    body: JSON.stringify({ route: "book-members", bookId: "book", event: { type, entryId } }),
  }), { createAdminClient: () => client, serviceRoleKey: "test", supabaseUrl: "https://test.invalid" });
  assert.equal((await send("first")).status, 200);
  assert.equal((await send("second")).status, 200);
  assert.equal((await send("first")).status, 429);
  assert.deepEqual(delivered.map((message) => message.data.badgeEntryId), ["first", "second"]);
  assert.equal((await send("first", "member_joined_book")).status, 200);
  assert.equal((await send("second", "member_joined_book")).status, 429);
});
