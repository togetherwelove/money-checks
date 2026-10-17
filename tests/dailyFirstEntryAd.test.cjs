const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { hooks } = require('./annualReportHelpers.cjs');
function load(file, mocks, globals = {}) {
  const exports = {};
  const source = new TextDecoder('utf-8', { fatal: true }).decode(fs.readFileSync(file));
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    { exports, require: key => { if (!(key in mocks)) throw Error(key); return mocks[key]; }, setTimeout, clearTimeout, Date, AbortController, __DEV__: false, ...globals });
  return exports;
}
function setup() {
  const h = hooks(); let now = 0, date = '2026-10-18', nextTimer = 0, ready = false, open, resolveAd, fail = false;
  let shows = 0, noticeSeen = false, recorded, changes;
  const timers = new Map(), errors = [];
  const app = { currentState: 'active', addEventListener: (_, cb) => { changes = cb; return { remove: () => { changes = null; } }; } };
  const props = { userId: 'user', screen: 'calendar', isReady: true, isSubscriptionLoading: false, isFree: true };
  const { useDailyFirstEntryAd } = load('src/hooks/useDailyFirstEntryAd.ts', {
    react: h.react, 'react-native': { AppState: app },
    '../constants/ads': { RewardedInterstitialNoticeConfig: { previewDurationMs: 900, readyPollIntervalMs: 120 } },
    '../utils/calendar': { toIsoDate: () => date }, '../lib/logAppError': { logAppError: (...args) => errors.push(args) },
    '../lib/ads/dailyFirstEntryInterstitial': {
      hasSeenDailyFirstEntrySaveInterstitialNotice: () => noticeSeen,
      hasShownDailyFirstEntrySaveInterstitial: (_, day) => recorded === day,
      markDailyFirstEntrySaveInterstitialShown: (_, day) => { recorded = day; },
      markDailyFirstEntrySaveInterstitialNoticeSeen: () => { noticeSeen = true; },
    },
    '../lib/ads/rewardedInterstitialAd': {
      isRewardedInterstitialAdReady: () => ready,
      showRewardedInterstitialAd: cb => { shows++; open = cb; ready = false; return fail ? Promise.reject(Error('SDK failure')) : new Promise(resolve => { resolveAd = resolve; }); },
    },
  }, { Date: class extends Date { static now() { return now; } }, setTimeout: (cb, delay) => { const id = ++nextTimer; timers.set(id, { cb, at: now + delay }); return id; }, clearTimeout: id => timers.delete(id) });
  let result;
  const render = () => { result = h.render(() => useDailyFirstEntryAd(props)); };
  render();
  return {
    props, errors, timers, request() { result.requestAdAfterSave(); render(); }, render,
    tick(ms = 120) { const until = now + ms; while (true) { const pair = [...timers].sort((a,b) => a[1].at-b[1].at)[0]; if (!pair || pair[1].at > until) break; now = pair[1].at; timers.delete(pair[0]); pair[1].cb(); render(); } now = until; },
    ready() { ready = true; }, fail() { fail = true; }, open() { open(); render(); }, close() { resolveAd?.({ didOpen: true }); },
    background(state) { app.currentState = state; changes(state); render(); }, nextDay() { date = '2026-10-19'; },
    unmount: h.unmount, get shows() { return shows; }, get recorded() { return recorded; }, get notice() { return result.isNoticeVisible; }, get subscribed() { return !!changes; },
  };
}
test('first save waits beyond old timeout and records at OPENED before close', () => {
  const s = setup(); s.request(); s.tick(5000); assert.equal(s.shows, 0);
  s.ready(); s.tick(1200); assert.equal(s.shows, 1); assert.equal(s.recorded, undefined);
  s.open(); assert.equal(s.recorded, '2026-10-18'); s.request(); s.tick(500); assert.equal(s.shows, 1); s.unmount();
});
test('pending survives subscription and SDK initialization; duplicate saves coalesce', () => {
  const s = setup(); s.props.isSubscriptionLoading = true; s.props.isReady = false; s.render(); s.request(); s.request(); s.ready(); s.tick(5000); assert.equal(s.shows, 0);
  s.props.isSubscriptionLoading = false; s.props.isReady = true; s.render(); s.tick(1200); assert.equal(s.shows, 1); s.unmount();
});
test('background cancels notice and resumes only on the originating screen', () => {
  const s = setup(); s.ready(); s.request(); s.tick(); assert.equal(s.notice, true); s.background('background'); assert.equal(s.notice, false); s.tick(3000); assert.equal(s.shows, 0);
  s.props.screen = 'settings'; s.background('active'); s.tick(3000); assert.equal(s.shows, 0);
  s.props.screen = 'calendar'; s.render(); s.tick(1200); assert.equal(s.shows, 1); s.unmount();
});
test('Plus and expired pending do not show; fresh next-day save does', () => {
  const plus = setup(); plus.props.isFree = false; plus.render(); plus.ready(); plus.request(); plus.tick(2000); assert.equal(plus.shows, 0); plus.unmount();
  const s = setup(); s.request(); s.nextDay(); s.ready(); s.tick(2000); assert.equal(s.shows, 0); s.request(); s.tick(1200); assert.equal(s.shows, 1); s.open(); assert.equal(s.recorded, '2026-10-19'); s.unmount();
});
test('SDK failure is contained, leaves no exposure record, and can retry', async () => {
  const s = setup(); s.fail(); s.ready(); s.request(); s.tick(1200); await new Promise(setImmediate); assert.equal(s.errors.length, 1); assert.equal(s.recorded, undefined);
  s.ready(); s.tick(1200); assert.equal(s.shows, 2); await new Promise(setImmediate); s.unmount(); assert.equal(s.timers.size, 0); assert.equal(s.subscribed, false);
});
test('unmount cancels pending notice and all hook resources', () => {
  const s = setup(); s.ready(); s.request(); s.tick(); s.unmount(); s.tick(2000); assert.equal(s.shows, 0); assert.equal(s.timers.size, 0); assert.equal(s.subscribed, false);
});

test('native OPENED callback is immediate and show rejection disposes result listeners', async () => {
  const ads = [], timers = new Map(); let timerId = 0;
  const native = load('src/lib/ads/rewardedInterstitialAd.native.ts', {
    'react-native': { Platform: { OS: 'ios' } },
    'react-native-google-mobile-ads': { AdEventType: { OPENED:'open', CLOSED:'close', ERROR:'error' }, RewardedAdEventType: { LOADED:'loaded', EARNED_REWARD:'reward' }, TestIds: {}, RewardedInterstitialAd: { createForAdRequest: () => {
      const listeners = new Map(); const ad = { load() {}, show: () => Promise.resolve(), addAdEventListener(event, cb) { const set = listeners.get(event) ?? new Set(); listeners.set(event,set); set.add(cb); return () => set.delete(cb); }, emit(event) { [...(listeners.get(event) ?? [])].forEach(cb => cb()); }, count() { return [...listeners.values()].reduce((sum,set)=>sum+set.size,0); } }; ads.push(ad); return ad;
    } } },
    '../../constants/ads': { AdMobRewardedInterstitialConfig: {}, RewardedInterstitialNoticeConfig: {} },
    '../logAppError': { logAppError() {}, logAppWarning() {} }, './adUnitId': { resolveAdMobAdUnitId: () => 'test' }, './adMobLoadError': { logAdMobLoadError() {} }, './adRequestOptions': { getAdRequestOptions: () => ({}) },
  }, { setTimeout: cb => { const id=++timerId; timers.set(id,cb); return id; }, clearTimeout: id=>timers.delete(id) });
  native.preloadRewardedInterstitialAd(); const first = ads[0]; first.emit('loaded'); let opened = 0;
  const result = native.showRewardedInterstitialAd(()=>opened++); first.emit('open'); first.emit('open'); assert.equal(opened,1); first.emit('close'); await result; assert.equal(first.count(),0); assert.equal(timers.size,0);
  const second=ads[1]; second.emit('loaded'); second.show=()=>Promise.reject(Error('show failed'));
  assert.equal((await native.showRewardedInterstitialAd()).didOpen,false); assert.equal(second.count(),0); assert.equal(timers.size,0); assert.equal(native.isRewardedInterstitialAdReady(),false);
});

test('successful manual and clipboard creation share trigger; edits and failed saves skip it', async () => {
  const source = fs.readFileSync('src/App.tsx', 'utf8');
  const tree = ts.createSourceFile('App.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let handler;
  function visit(node) { if (ts.isVariableDeclaration(node) && node.name.getText(tree) === 'handleSaveEntry') handler = node.initializer.getText(tree); ts.forEachChild(node, visit); }
  visit(tree); assert.ok(handler);
  let triggered = 0, saved = [{}], failure = false;
  const ledgerState = { entries: [], draft: { date: '2026-10-18' }, editingEntryId: null, handleSaveEntry: async () => { if (failure) throw Error('save failed'); return saved; } };
  const code = ts.transpileModule(`const handler = ${handler};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const save = vm.runInNewContext(`${code}\nhandler;`, { ledgerState, runEntrySaveSideEffects: () => {}, handleDailyFirstEntrySaveInterstitial: () => { triggered++; }, logAppError() {}, showNativeToast() {}, resolveLedgerSaveErrorMessage: () => 'failure' });
  assert.equal(await save(), true); assert.equal(triggered, 1);
  assert.equal(await save({ date: '2026-10-18', content: 'clipboard' }), true); assert.equal(triggered, 2);
  ledgerState.editingEntryId = 'existing'; assert.equal(await save(), true); assert.equal(triggered, 2);
  ledgerState.editingEntryId = null; assert.equal(await save({date:'2026-10-18'}, {id:'existing'}), true); assert.equal(triggered, 2);
  saved = []; assert.equal(await save(), false); failure = true; assert.equal(await save(), false); assert.equal(triggered, 2);
  assert.match(source, /onSaveEntry=\{handleSaveEntry\}/); assert.match(source, /onSave=\{handleSaveEntry\}/);
});

test('day already exposed stays suppressed after close; next day permits new exposure', async () => {
  const s = setup(); s.ready(); s.request(); s.tick(1200); s.open(); s.close(); await new Promise(setImmediate);
  s.ready(); s.request(); s.tick(1200); assert.equal(s.shows, 1);
  s.nextDay(); s.request(); s.tick(1200); assert.equal(s.shows, 2); s.unmount();
});

test('account change drops old pending and never shows it for the new account', () => {
  const s = setup(); s.request(); s.props.userId = 'other'; s.render(); s.ready(); s.tick(2000); assert.equal(s.shows, 0); s.unmount();
});
