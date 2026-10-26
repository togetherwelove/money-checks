const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const flush = () => new Promise(setImmediate);

function setup() {
  const ads = [], timers = new Map(); let timerId = 0;
  const mocks = {
    'react-native': { Platform: { OS: 'ios' } },
    'react-native-google-mobile-ads': {
      AdEventType: { OPENED: 'open', CLOSED: 'close', ERROR: 'error' },
      RewardedAdEventType: { LOADED: 'loaded', EARNED_REWARD: 'reward' }, TestIds: {},
      RewardedInterstitialAd: { createForAdRequest: () => {
        const listeners = new Map();
        const ad = { load() {}, show: () => Promise.resolve(),
          addAdEventListener(event, callback) { const set = listeners.get(event) ?? new Set(); listeners.set(event, set); set.add(callback); return () => set.delete(callback); },
          emit(event) { listeners.get(event)?.forEach(callback => callback()); },
          count() { return [...listeners.values()].reduce((total, set) => total + set.size, 0); },
        }; ads.push(ad); return ad;
      } },
    },
    '../../constants/ads': { AdMobRewardedInterstitialConfig: {}, RewardedInterstitialReadinessConfig: {} },
    '../logAppError': { logAppError() {}, logAppWarning() {} },
    './adUnitId': { resolveAdMobAdUnitId: () => 'test' },
    './adMobLoadError': { logAdMobLoadError() {} }, './adRequestOptions': { getAdRequestOptions: () => ({}) },
  };
  const exports = {};
  const source = fs.readFileSync('src/lib/ads/rewardedInterstitialAd.native.ts', 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require: key => { if (!(key in mocks)) throw Error(key); return mocks[key]; },
    Date, AbortController, __DEV__: false,
    setTimeout: callback => { const id = ++timerId; timers.set(id, callback); return id; }, clearTimeout: id => timers.delete(id),
  });
  exports.preloadRewardedInterstitialAd();
  ads[0].emit('loaded');
  return { native: exports, ads, timers };
}

test('SDK reward alone does not finish the request; completed viewing resolves only after CLOSED', async () => {
  const f = setup(); const ad = f.ads[0]; let settled = false, opened = 0;
  const pending = f.native.showRewardedInterstitialAd(() => opened++).then(result => { settled = true; return result; });
  assert.equal((await f.native.showRewardedInterstitialAd()).didClose, false);
  ad.emit('open'); ad.emit('open'); ad.emit('reward'); await flush();
  assert.equal(opened, 1); assert.equal(settled, false);
  ad.emit('close');
  const result = await pending;
  assert.equal(result.didOpen, true); assert.equal(result.didEarnReward, true); assert.equal(result.didClose, true);
  assert.equal(ad.count(), 0); assert.equal(f.timers.size, 0);
});

test('closing early reports no earned reward and a failed show cannot grant completion', async () => {
  const f = setup(); const first = f.native.showRewardedInterstitialAd();
  f.ads[0].emit('open'); f.ads[0].emit('close');
  const early = await first;
  assert.equal(early.didClose, true); assert.equal(early.didEarnReward, false);
  const second = f.ads[1]; second.emit('loaded'); second.show = () => Promise.reject(Error('Presentation failed'));
  const failed = await f.native.showRewardedInterstitialAd();
  assert.equal(failed.didClose, false); assert.equal(failed.didEarnReward, false);
  assert.equal(second.count(), 0); assert.equal(f.timers.size, 0);
});

test('reward followed by result timeout is not treated as a closed and completed ad', async () => {
  const f = setup(); const ad = f.ads[0];
  const pending = f.native.showRewardedInterstitialAd();
  ad.emit('open'); ad.emit('reward');
  [...f.timers.values()][0]();
  const timedOut = await pending;
  assert.equal(timedOut.didEarnReward, true); assert.equal(timedOut.didClose, false);
  assert.equal(f.native.isRewardedInterstitialAdReady(), false);
  ad.emit('close');
  assert.equal(ad.count(), 0); assert.equal(f.timers.size, 0);
});
