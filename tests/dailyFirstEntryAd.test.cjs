const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { modules, hooks } = require('./annualReportHelpers.cjs');
const flush = () => new Promise(setImmediate);
const watched = { didOpen: true, didEarnReward: true, didClose: true };

function setup() {
  const h = hooks(), completed = new Map(), toasts = [], errors = [];
  const props = { userId: 'user', bookId: 'book', isReady: true, isSubscriptionLoading: false, isFree: true };
  const f = { props, completed, toasts, errors, shows: 0, date: '2026-10-25', ready: true, failShow: false,
    storageFails: false, appState: { currentState: 'active' }, finish: null, readyWait: null };
  const load = modules({
    react: h.react, 'react-native': { AppState: f.appState },
    'src/utils/calendar.ts': { toIsoDate: () => f.date },
    'src/lib/nativeToast.ts': { showNativeToast: text => toasts.push(text) },
    'src/lib/logAppError.ts': { logAppError: (...args) => errors.push(args) },
    'src/lib/ads/dailyFirstEntryInterstitial.ts': {
      hasCompletedDailyFirstEntryAd: (user, date) => completed.get(user) === date,
      markDailyFirstEntryAdCompleted: (user, date) => { if (f.storageFails) throw Error('Storage failed'); completed.set(user, date); },
    },
    '../lib/ads/rewardedInterstitialAd': {
      waitForRewardedInterstitialAdReady: () => f.readyWait ?? Promise.resolve(f.ready),
      showRewardedInterstitialAd: () => { f.shows++; if (f.failShow) return Promise.reject(Error('SDK failed'));
        return new Promise(resolve => { f.finish = resolve; }); },
    },
  });
  const { useDailyFirstEntryAd } = load('src/hooks/useDailyFirstEntryAd.ts');
  let result;
  f.render = () => { result = h.render(() => useDailyFirstEntryAd({ ...props })); };
  f.request = () => result.ensureAdBeforeSave();
  f.unmount = h.unmount;
  f.render();
  return f;
}

test('save permission stays pending until the ad grants reward and closes; completion is recorded only then', async () => {
  const f = setup(); let settled = false;
  const pending = f.request().then(value => { settled = true; return value; });
  await flush();
  assert.equal(f.shows, 1);
  assert.equal(settled, false);
  assert.equal(f.completed.has('user'), false);
  assert.equal(await f.request(), false);
  f.finish(watched);
  assert.equal(await pending, true);
  assert.equal(f.completed.get('user'), f.date);
  assert.equal(await f.request(), true);
  assert.equal(f.shows, 1);
  f.date = '2026-10-26';
  const nextDay = f.request(); await flush();
  assert.equal(f.shows, 2);
  f.finish(watched); assert.equal(await nextDay, true);
  f.unmount();
});

test('early dismissal, unavailable ads, SDK failure and reward without closure all refuse saving and remain retryable', async () => {
  const f = setup();
  for (const outcome of [
    { didOpen: true, didClose: true, didEarnReward: false },
    { didOpen: true, didClose: false, didEarnReward: true },
    { didOpen: false, didClose: false, didEarnReward: false },
  ]) {
    const pending = f.request(); await flush(); f.finish(outcome);
    assert.equal(await pending, false);
    assert.equal(f.completed.has('user'), false);
  }
  f.ready = false; assert.equal(await f.request(), false);
  f.ready = true; f.failShow = true; assert.equal(await f.request(), false);
  f.failShow = false;
  const retry = f.request(); await flush(); f.finish(watched);
  assert.equal(await retry, true);
  assert.equal(f.toasts.length, 5);
  f.unmount();
});

test('Plus and completed days bypass the ad; subscription, initialization and background states cannot bypass it', async () => {
  const f = setup();
  f.props.isFree = false; f.render(); assert.equal(await f.request(), true);
  f.props.isFree = true; f.props.isSubscriptionLoading = true; f.render(); assert.equal(await f.request(), false);
  f.props.isSubscriptionLoading = false; f.props.isReady = false; f.render(); assert.equal(await f.request(), false);
  f.props.isReady = true; f.render(); f.appState.currentState = 'background'; assert.equal(await f.request(), false);
  f.appState.currentState = 'active'; f.completed.set('user', f.date);
  assert.equal(await f.request(), true);
  assert.equal(f.shows, 0);
  f.unmount();
});

test('changing accounts or books, and unmounting, cancel permission even after successful viewing', async () => {
  for (const change of [f => { f.props.userId = 'other'; f.render(); },
    f => { f.props.bookId = 'other'; f.render(); }, f => f.unmount()]) {
    const f = setup(); const pending = f.request(); await flush(); change(f); f.finish(watched);
    assert.equal(await pending, false);
    assert.equal(f.completed.size, 0);
    assert.equal(f.toasts.length, 0);
    f.unmount();
  }
  const f = setup(); let resolveReady;
  f.readyWait = new Promise(resolve => { resolveReady = resolve; });
  const pending = f.request(); f.props.bookId = 'other'; f.render(); resolveReady(true);
  assert.equal(await pending, false); assert.equal(f.shows, 0); f.unmount();
});

test('a completed viewing remains valid in memory if persisting its proof fails', async () => {
  const f = setup(); f.storageFails = true;
  const pending = f.request(); await flush(); f.finish(watched);
  assert.equal(await pending, true);
  assert.equal(await f.request(), true);
  assert.equal(f.shows, 1);
  assert.equal(f.errors.length, 1);
  f.unmount();
});

test('legacy OPENED records are not treated as completed viewing', () => {
  const values = new Map([['money-checks.ads.daily-first-entry-save.v2.user', '2026-10-25']]);
  const load = modules({ 'src/lib/appStorage.ts': { appStorage: {
    getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value),
  } } });
  const storage = load('src/lib/ads/dailyFirstEntryInterstitial.ts');
  assert.equal(storage.hasCompletedDailyFirstEntryAd('user', '2026-10-25'), false);
  storage.markDailyFirstEntryAdCompleted('user', '2026-10-25');
  assert.equal(storage.hasCompletedDailyFirstEntryAd('user', '2026-10-25'), true);
});

test('both manual and clipboard saves wait before database writes, and refused attempts preserve the draft', async () => {
  const source = fs.readFileSync('src/App.tsx', 'utf8');
  const tree = ts.createSourceFile('App.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let handler;
  function visit(node) { if (ts.isVariableDeclaration(node) && node.name.getText(tree) === 'handleSaveEntry') handler = node.initializer.getText(tree); ts.forEachChild(node, visit); }
  visit(tree); assert.ok(handler);
  let resolveAd, gates = 0, writes = 0, saved = [{}], failure = false, effects = 0;
  const draft = { date: '2026-10-25', amount: '100', content: 'Lunch', categoryId: 'food' };
  const ledgerState = { activeBook: { id: 'book' }, entries: [], draft, editingEntryId: null,
    handleSaveEntry: async () => { writes++; if (failure) throw Error('Save failed'); return saved; } };
  const code = ts.transpileModule(`const handler = ${handler};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const save = vm.runInNewContext(`${code}\nhandler;`, {
    ledgerState, entrySaveInProgress: { current: false }, canSubmitDraft: value => !!value.amount,
    ensureAdBeforeSave: () => { gates++; return new Promise(resolve => { resolveAd = resolve; }); },
    runEntrySaveSideEffects: () => { effects++; }, logAppError() {}, showNativeToast() {}, resolveLedgerSaveErrorMessage: () => 'failure',
  });
  for (const incoming of [undefined, { ...draft, content: 'Clipboard' }]) {
    const pending = save(incoming);
    assert.equal(writes, gates - 1);
    assert.equal(await save(incoming), false);
    resolveAd(true); assert.equal(await pending, true);
  }
  assert.equal(writes, 2); assert.equal(effects, 2);
  const refused = save(); resolveAd(false); assert.equal(await refused, false);
  assert.equal(writes, 2); assert.equal(ledgerState.draft, draft);
  ledgerState.editingEntryId = 'existing'; assert.equal(await save(), true); assert.equal(gates, 3);
  ledgerState.editingEntryId = null; assert.equal(await save(draft, { id: 'existing' }), true); assert.equal(gates, 3);
  saved = []; const empty = save(); resolveAd(true); assert.equal(await empty, false);
  failure = true; const failed = save(); resolveAd(true); assert.equal(await failed, false);
  const invalid = { ...draft, amount: '' }; assert.equal(await save(invalid), false);
  assert.match(source, /onSaveEntry=\{handleSaveEntry\}/); assert.match(source, /onSave=\{handleSaveEntry\}/);
});
