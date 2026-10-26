const assert = require('node:assert/strict');
const test = require('node:test');
const { modules } = require('./annualReportHelpers.cjs');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const ads = { exports: {}, process: { env: {} }, require: () => modules()('src/constants/layout.ts') };
vm.runInNewContext(ts.transpileModule(
  fs.readFileSync(path.join(__dirname, '../src/constants/ads.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText, ads);
const { resolveNativeAdLayout } = modules({
  'src/constants/ads.ts': ads.exports,
})('src/lib/ads/nativeAdLayout.ts');

test('narrow cards and accessibility text put the action below the copy', () => {
  assert.equal(resolveNativeAdLayout(320, 1).stacked, true);
  assert.equal(resolveNativeAdLayout(600, 2).stacked, true);
  assert.equal(resolveNativeAdLayout(390, 1).stacked, false);
});

test('loading space grows with text scale and reserves the extra action row', () => {
  const normal = resolveNativeAdLayout(390, 1);
  const narrow = resolveNativeAdLayout(320, 1);
  const large = resolveNativeAdLayout(320, 2);
  const largest = resolveNativeAdLayout(320, 3);
  assert.ok(narrow.reservedHeight > normal.reservedHeight);
  assert.ok(large.reservedHeight > narrow.reservedHeight);
  assert.ok(largest.reservedHeight > large.reservedHeight);
});
