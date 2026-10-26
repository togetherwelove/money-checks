const assert = require('node:assert/strict');
const test = require('node:test');
const { hooks, modules } = require('./annualReportHelpers.cjs');

function setup(initialReady) {
  const harness = hooks();
  let ready = initialReady;
  let dismissCount = 0;
  const load = modules({
    react: { ...harness.react, useCallback: callback => callback },
    'expo-splash-screen': {
      hideAsync: async () => { dismissCount++; },
    },
  });
  const { useDismissStartupSplash } = load('src/hooks/useDismissStartupSplash.ts');
  const render = () => harness.render(() => useDismissStartupSplash(ready));
  let onLayout = render();
  return {
    get dismissCount() { return dismissCount; },
    layout() { onLayout(); onLayout = render(); },
    ready(value) { ready = value; onLayout = render(); },
  };
}

test('keeps native splash until profile checks finish even when layout is ready', () => {
  const startup = setup(false);
  startup.layout();
  assert.equal(startup.dismissCount, 0);
  startup.ready(true);
  assert.equal(startup.dismissCount, 1);
});

test('waits for the first screen layout after initialization', () => {
  const startup = setup(true);
  assert.equal(startup.dismissCount, 0);
  startup.layout();
  assert.equal(startup.dismissCount, 1);
});

test('later layouts and loading changes do not dismiss splash again', () => {
  const startup = setup(true);
  startup.layout();
  startup.layout();
  startup.ready(false);
  startup.ready(true);
  assert.equal(startup.dismissCount, 1);
});
