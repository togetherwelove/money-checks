const assert = require("node:assert/strict");
const test = require("node:test");
const { modules, hooks } = require("./annualReportHelpers.cjs");

function books(overrides = {}) {
  let activeBook = { id: "a", ownerId: "me" },
    accessibleBooks = [activeBook],
    error = null;
  let refreshes = 0;
  const load = modules({
    "src/lib/ledgerBooks.ts": overrides,
    "src/lib/logAppError.ts": { logAppError() {} },
    "src/lib/sharedLedgerExitIntent.ts": {},
  });
  const { createLedgerBookActions } = load("src/hooks/ledgerScreenState/ledgerBookActions.ts");
  const options = {
    userId: "me",
    activeBook,
    trackBusyTask: (task) => task(),
    setActiveBook: (update) => {
      activeBook = typeof update === "function" ? update(activeBook) : update;
    },
    setAccessibleBooks: (update) => {
      accessibleBooks = typeof update === "function" ? update(accessibleBooks) : update;
    },
    setActiveBookError: (value) => {
      error = value;
    },
    loadActiveBook: async () => {},
    refreshAccessibleLedgerBookState: async () => {
      refreshes++;
      activeBook = { id: "fallback" };
    },
  };
  return {
    options,
    actions: () => createLedgerBookActions(options),
    active: () => activeBook,
    accessible: () => accessibleBooks,
    error: () => error,
    refreshes: () => refreshes,
  };
}

test("failed create, delete and switch restore the prior book", async () => {
  const reject = async () => {
    throw new Error("offline");
  };
  const ui = books({
    createOwnedLedgerBook: reject,
    deleteOwnedLedgerBook: reject,
    switchActiveLedgerBook: reject,
  });
  const previous = ui.active(),
    actions = ui.actions();
  assert.equal(await actions.createLedgerBook("New"), false);
  assert.equal(ui.active(), previous);
  assert.equal(await actions.deleteActiveLedgerBook(), false);
  assert.equal(ui.active(), previous);
  assert.equal(await actions.switchLedgerBook("b"), false);
  assert.equal(ui.active(), previous);
});

test("inaccessible switch refreshes membership and falls back if the refresh also fails", async () => {
  const ui = books({
    switchActiveLedgerBook: async () => {
      throw new Error("book is not accessible to user");
    },
  });
  assert.equal(await ui.actions().switchLedgerBook("b"), false);
  assert.equal(ui.active().id, "fallback");
  assert.equal(ui.refreshes(), 1);
  ui.options.refreshAccessibleLedgerBookState = async () => {
    throw new Error("offline");
  };
  assert.equal(await ui.actions().switchLedgerBook("b"), false);
  assert.equal(ui.active(), ui.options.activeBook);
});

test("rename retains owner restriction and updates both current and accessible book snapshots", async () => {
  let writes = 0;
  const next = { id: "a", ownerId: "me", name: "Renamed" };
  const ui = books({
    updateActiveLedgerBookName: async () => {
      writes++;
      return next;
    },
  });
  ui.options.userId = "other";
  assert.equal(await ui.actions().renameActiveLedgerBook("Renamed"), false);
  assert.equal(writes, 0);
  ui.options.userId = "me";
  assert.equal(await ui.actions().renameActiveLedgerBook("Renamed"), true);
  assert.equal(ui.active(), next);
  assert.equal(ui.accessible()[0].name, "Renamed");
  assert.equal(ui.error(), null);
});

test("book realtime reconnects with unique channels and releases all subscriptions on switching or unmount", async () => {
  const h = hooks(),
    channels = [],
    removed = [];
  let activeBook = { id: "a" },
    finishFetch;
  const load = modules({
    react: h.react,
    "src/lib/supabase.ts": {
      supabase: {
        channel: (name) => {
          const channel = {
            name,
            on(_event, filter, callback) {
              channel.filter = filter;
              channel.callback = callback;
              return channel;
            },
            subscribe() {
              channels.push(channel);
              return channel;
            },
          };
          return channel;
        },
        removeChannel: (channel) => {
          removed.push(channel);
        },
      },
    },
    "src/lib/logAppError.ts": { logAppError() {} },
    "src/lib/ledgerBooks.ts": {
      fetchLedgerBookById: () =>
        new Promise((resolve) => {
          finishFetch = resolve;
        }),
      fetchAccessibleLedgerBooks: async () => [{ id: "b" }],
    },
  });
  const { useLedgerBookRealtime } = load("src/hooks/ledgerScreenState/useLedgerBookRealtime.ts");
  const render = () =>
    h.render(() =>
      useLedgerBookRealtime({
        userId: "me",
        activeBook,
        setActiveBook: (value) => {
          activeBook = value;
        },
        setAccessibleBooks() {},
        setActiveBookError() {},
      }),
    );
  render();
  assert.equal(channels.length, 3);
  assert.deepEqual(
    channels.map((channel) => channel.filter.table),
    ["profiles", "ledger_books", "ledger_book_members"],
  );
  const lateProfile = channels[0].callback({ new: { active_book_id: "old" } });
  activeBook = { id: "b" };
  render();
  assert.equal(removed.length, 3);
  finishFetch({ id: "old" });
  await lateProfile;
  await new Promise(setImmediate);
  assert.equal(activeBook.id, "b");
  assert.equal(new Set(channels.map((channel) => channel.name)).size, 6);
  h.unmount();
  assert.equal(removed.length, 6);
});
