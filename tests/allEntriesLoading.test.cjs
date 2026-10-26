const assert = require('node:assert/strict');
const test = require('node:test');
const { modules, hooks } = require('./annualReportHelpers.cjs');

function setup() {
  const h = hooks(), requests = [];
  let unsubscribed = 0;
  const load = modules({
    react: { ...h.react, useCallback(callback, deps) {
      const memo = h.react.useRef();
      if (!memo.current || deps.some((dep, index) => dep !== memo.current.deps[index])) memo.current = { deps, callback };
      return memo.current.callback;
    } },
    'src/lib/ledgerEntries.ts': { fetchLedgerEntriesPage: (bookId, query) => new Promise(resolve => {
      requests.push({ bookId, query, resolve });
    }) },
    'src/lib/ledgerEntryRealtime.ts': { subscribeToLedgerEntryChanges: () => () => unsubscribed++ },
    'src/lib/logAppError.ts': { logAppError() {} },
  });
  const { useAllLedgerEntries } = load('src/hooks/useAllLedgerEntries.ts');
  const params = { activeBookId: 'first', selectedCategoryIds: [], searchQuery: '',
    trackBlockingTask: () => { throw Error('Page reads must not block navigation'); } };
  return { params, requests, render: () => h.render(() => useAllLedgerEntries(params)),
    unmount: h.unmount, unsubscribed: () => unsubscribed };
}

test('initial list loading stays local and exposes results without a global blocking task', async () => {
  const ui = setup();
  let state = ui.render();
  assert.equal(state.isRefreshing, true);
  assert.equal(state.entries.length, 0);
  ui.requests[0].resolve({ entries: [{ id: 'entry' }], hasMore: false, nextCursor: null });
  await new Promise(setImmediate);
  state = ui.render();
  assert.equal(state.isRefreshing, false);
  assert.equal(state.entries[0].id, 'entry');
  ui.unmount();
  assert.equal(ui.unsubscribed(), 1);
});

test('changing books drops visible stale data and ignores older pending responses', async () => {
  const ui = setup();
  ui.render();
  ui.params.activeBookId = 'second';
  let state = ui.render();
  assert.equal(state.entries.length, 0);
  assert.equal(state.isRefreshing, true);
  ui.requests[0].resolve({ entries: [{ id: 'old' }], hasMore: false, nextCursor: null });
  await new Promise(setImmediate);
  assert.equal(ui.render().entries.length, 0);
  ui.requests[1].resolve({ entries: [{ id: 'new' }], hasMore: false, nextCursor: null });
  await new Promise(setImmediate);
  state = ui.render();
  assert.equal(state.entries[0].id, 'new');
  assert.equal(state.isRefreshing, false);
  ui.unmount();
});
