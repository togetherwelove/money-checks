const assert = require('node:assert/strict');
const test = require('node:test');
const { modules } = require('./annualReportHelpers.cjs');
const { NativeAdCache } = modules()('src/lib/ads/nativeAdCache.ts');
const ad = () => ({ destroyed: 0, destroy() { this.destroyed++; } });

test('virtualized cells reuse the same loaded ad and concurrent requests are deduplicated', async () => {
  let loads = 0;
  const value = ad();
  const pool = new NativeAdCache(async () => { loads++; return value; }, 3, 60000, 1000);
  const first = pool.acquire(0), second = pool.acquire(0);
  assert.equal(await first.promise, await second.promise);
  first.release(); second.release();
  const returned = pool.acquire(0);
  assert.equal(await returned.promise, value);
  assert.equal(loads, 1);
  assert.equal(value.destroyed, 0);
  returned.release(); pool.dispose();
  assert.equal(value.destroyed, 1);
});

test('idle cache is bounded without destroying visible ads', async () => {
  const values = [ad(), ad(), ad()];
  const pool = new NativeAdCache(async slot => values[slot], 1, 60000, 1000);
  const visible = pool.acquire(0); await visible.promise;
  for (const slot of [1, 2]) { const lease = pool.acquire(slot); await lease.promise; lease.release(); }
  assert.equal(values[0].destroyed, 0);
  assert.equal(values[1].destroyed, 1);
  assert.equal(values[2].destroyed, 0);
  visible.release(); pool.dispose();
  assert.ok(values.every(value => value.destroyed === 1));
});

test('late requests are destroyed after screen disposal and expired ads are never reused', async () => {
  let finish;
  const value = ad();
  const pool = new NativeAdCache(() => new Promise(resolve => { finish = resolve; }), 1, 0, 0);
  const lease = pool.acquire(0);
  await Promise.resolve();
  pool.dispose(); finish(value);
  assert.equal(await lease.promise, null);
  lease.release();
  assert.equal(value.destroyed, 1);
  let loads = 0;
  const expiring = new NativeAdCache(async () => { loads++; return ad(); }, 1, 0, 0);
  const old = expiring.acquire(0); const oldAd = await old.promise; old.release();
  const fresh = expiring.acquire(0); await fresh.promise;
  assert.equal(loads, 2); assert.equal(oldAd.destroyed, 1);
  fresh.release(); expiring.dispose();
});

test('failed requests have a cooldown rather than retrying on every cell mount', async () => {
  let loads = 0;
  const pool = new NativeAdCache(async () => { loads++; throw Error('offline'); }, 1, 60000, 60000);
  const first = pool.acquire(0); assert.equal(await first.promise, null); first.release();
  const again = pool.acquire(0); assert.equal(await again.promise, null); again.release();
  assert.equal(loads, 1); pool.dispose();
});
