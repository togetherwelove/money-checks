const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

function load(file, mocks) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(source, { exports, require: (name) => {
    if (name in mocks) return mocks[name];
    if (name.endsWith("constants/notificationBadges")) {
      return load("src/constants/notificationBadges.ts", {});
    }
    throw new Error(`Unexpected dependency: ${name}`);
  } });
  return exports;
}

test("push read target uses payload book and entry and rejects other notifications", () => {
  const { resolveEntryNotificationReadTarget: resolve } = load("src/lib/notifications/entryNotificationReads.ts", {
    "../supabase": {},
  });
  const data = { badgeKind: "ledger-entry", badgeBookId: "other-book", badgeEntryId: "entry" };
  assert.equal(JSON.stringify(resolve(data)), JSON.stringify({ bookId: "other-book", entryId: "entry" }));
  for (const invalid of [undefined, {}, { ...data, badgeKind: "join-request" }, { ...data, badgeEntryId: "" }, { ...data, badgeBookId: null }]) {
    assert.equal(resolve(invalid), null);
  }
});

test("dismissing selected entries preserves other entries, books, and join requests", async () => {
  const dismissed = [];
  const notification = (identifier, badgeBookId, badgeEntryId, badgeKind = "ledger-entry") => ({
    request: { identifier, content: { data: { badgeBookId, badgeEntryId, badgeKind } } },
  });
  const { dismissPresentedNotificationBadges: dismiss } = load("src/lib/notifications/notificationBadges.ts", {
    "expo-notifications": {
      getPresentedNotificationsAsync: async () => [
        notification("seen", "book", "entry"), notification("unseen", "book", "other"),
        notification("other-book", "other-book", "entry"), notification("join", "book", "entry", "join-request"),
      ],
      dismissNotificationAsync: async (id) => dismissed.push(id),
    },
    "../appStorage": {}, "../supabase": {},
  });
  await dismiss("book", "ledger-entries", ["entry"]);
  assert.deepEqual(dismissed, ["seen"]);
  dismissed.length = 0;
  await dismiss("book", "ledger-entries");
  assert.deepEqual(dismissed, ["seen", "unseen"]);
});

function mount({ screen = "calendar", appState = "active", state = {}, fails = false } = {}) {
  const calls = [], effects = [], cleanups = [];
  const { useEntryNotificationReads } = load("src/hooks/useEntryNotificationReads.ts", {
    react: {
      useCallback: (callback) => callback, useRef: (current) => ({ current }),
      useEffect: (effect) => effects.push(effect),
    },
    "react-native": { AppState: { currentState: appState, addEventListener: () => ({ remove: () => cleanups.push(true) }) } },
    "../lib/logAppError": { logAppError: () => calls.push("error") },
    "../lib/notifications/entryNotificationReads": { markEntryNotificationsRead: async (book, ids) => {
      calls.push([book, ...ids]);
      if (fails) throw new Error("offline");
    } },
    "../lib/notifications/notificationBadges": { dismissPresentedNotificationBadges: async (book, scope, ids) => calls.push(["dismiss", book, scope, ...ids]) },
  });
  const read = useEntryNotificationReads(screen === "calendar", {
    activeBook: { id: "book" }, selectedDate: "2026-10-03", isLoadingSelectedDateEntries: false,
    errorMessage: null, selectedEntries: [{ id: "seen", date: "2026-10-03" }, { id: "other", date: "2026-10-02" }],
    ...state,
  }, async () => calls.push("refresh"));
  return { read, calls, effects, cleanups };
}

test("calendar reads only displayed date after loading and releases listener", async () => {
  const instance = mount();
  const cleanup = instance.effects[0]();
  await new Promise(setImmediate);
  assert.deepEqual(instance.calls, [["book", "seen"], "refresh", ["dismiss", "book", "ledger-entries", "seen"]]);
  cleanup();
  assert.equal(instance.cleanups.length, 1);
});

test("hidden, loading, failed, empty and background lists do not mark entries read", async () => {
  for (const options of [
    { screen: "charts" }, { appState: "background" }, { state: { isLoadingSelectedDateEntries: true } },
    { state: { errorMessage: "failed" } }, { state: { selectedEntries: [] } }, { state: { activeBook: null } },
  ]) {
    const instance = mount(options);
    instance.effects[0]();
    await new Promise(setImmediate);
    assert.deepEqual(instance.calls, []);
  }
});

test("push reads work independently of current screen and deduplicate in-flight requests", async () => {
  const instance = mount({ screen: "charts" });
  await Promise.all([instance.read("push-book", ["push-entry"]), instance.read("push-book", ["push-entry"])]);
  assert.deepEqual(instance.calls, [["push-book", "push-entry"], "refresh", ["dismiss", "push-book", "ledger-entries", "push-entry"]]);
});

test("failed persistence keeps notifications and permits retry", async () => {
  const instance = mount({ fails: true });
  await instance.read("book", ["seen"]);
  await instance.read("book", ["seen"]);
  assert.deepEqual(instance.calls, [["book", "seen"], "error", ["book", "seen"], "error"]);
});
