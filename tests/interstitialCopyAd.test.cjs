const assert = require('node:assert/strict');
const test = require('node:test');
const { modules } = require('./annualReportHelpers.cjs');
const flush = () => new Promise(setImmediate);

function setup(unitId = 'test-unit') {
  const ads = [], errors = [];
  const events = { LOADED: 'loaded', OPENED: 'opened', CLOSED: 'closed', ERROR: 'error' };
  const load = modules({
    'react-native-google-mobile-ads': {
      AdEventType: events, TestIds: { INTERSTITIAL: 'test-unit' },
      InterstitialAd: { createForAdRequest: () => {
        const listeners = new Map();
        const ad = { loadCalls: 0, showCalls: 0, rejectShow: false,
          addAdEventListener: (event, callback) => {
            if (!listeners.has(event)) listeners.set(event, new Set());
            listeners.get(event).add(callback); return () => listeners.get(event).delete(callback);
          },
          emit: (event, value) => listeners.get(event)?.forEach(callback => callback(value)),
          count: () => [...listeners.values()].reduce((total, values) => total + values.size, 0),
          load: () => { ad.loadCalls++; },
          show: async () => { ad.showCalls++; if (ad.rejectShow) throw Error('Presentation failed'); ad.emit('opened'); },
        }; ads.push(ad); return ad;
      } },
    },
    'src/constants/ads.ts': { AdMobInterstitialConfig: {}, InterstitialAdTiming: { loadTimeoutMs: 20, loadRetryDelayMs: 10000 } },
    'src/lib/ads/adUnitId.ts': { resolveAdMobAdUnitId: () => unitId },
    'src/lib/ads/adRequestOptions.ts': { getAdRequestOptions: () => ({}) },
    'src/lib/ads/adMobLoadError.ts': { logAdMobLoadError: (...args) => errors.push(args) },
    'src/lib/logAppError.ts': { logAppError: (...args) => errors.push(args), logAppWarning() {} },
  });
  return { ...load('src/lib/ads/interstitialAd.native.ts'), ads, errors };
}

async function display(f) {
  const pending = f.showInterstitialAd('share-code-copy', { waitForLoad: true });
  const ad = f.ads.at(-1);
  ad.emit('loaded'); await flush();
  ad.emit('closed');
  assert.equal(await pending, true);
  assert.equal(ad.showCalls, 1);
  assert.equal(ad.count(), 0);
}

test('each copy loads and presents a fresh ad and concurrent presentation is rejected', async () => {
  const f = setup();
  const first = f.showInterstitialAd('share-code-copy', { waitForLoad: true });
  assert.equal(f.ads[0].showCalls, 0);
  assert.equal(await f.showInterstitialAd('share-code-copy', { waitForLoad: true }), false);
  f.ads[0].emit('loaded'); await flush();
  assert.equal(f.ads[0].showCalls, 1);
  f.ads[0].emit('closed');
  assert.equal(await first, true);
  assert.equal(f.ads[0].count(), 0);
  await display(f);
  assert.equal(f.ads.length, 3);
});

test('load errors resolve without blocking and the next copy retries loading', async () => {
  const f = setup();
  const pending = f.showInterstitialAd('share-code-copy', { waitForLoad: true });
  f.ads[0].emit('error', Error('No fill'));
  assert.equal(await pending, false);
  assert.equal(f.ads[0].count(), 0);
  await display(f);
});

test('loading times out cleanly and a later loaded ad remains usable on the next copy', async () => {
  const f = setup();
  assert.equal(await f.showInterstitialAd('share-code-copy', { waitForLoad: true }), false);
  assert.equal(f.ads[0].count(), 4);
  await display(f);
});

test('presentation failure cancels dismissal listeners and allows a later attempt', async () => {
  const f = setup(); f.preloadInterstitialAd();
  f.ads[0].emit('loaded'); f.ads[0].rejectShow = true;
  assert.equal(await f.showInterstitialAd('share-code-copy', { waitForLoad: true }), false);
  assert.equal(f.ads[0].count(), 0);
  await display(f);
});

test('display errors settle the copy ad request and missing unit IDs do not wait forever', async () => {
  const f = setup();
  const pending = f.showInterstitialAd('share-code-copy', { waitForLoad: true });
  f.ads[0].emit('loaded'); await flush();
  f.ads[0].emit('error', Error('Display failed'));
  assert.equal(await pending, false);
  await display(f);
  const unconfigured = setup('');
  assert.equal(await unconfigured.showInterstitialAd('share-code-copy', { waitForLoad: true }), false);
  assert.equal(unconfigured.ads.length, 0);
});

test('other placements retain their existing ready-only behavior', async () => {
  const f = setup();
  assert.equal(await f.showInterstitialAd('annual-report-download'), false);
  f.ads[0].emit('loaded');
  const pending = f.showInterstitialAd('annual-report-download');
  await flush();
  f.ads[0].emit('closed');
  assert.equal(await pending, true);
});
