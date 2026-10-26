const assert = require('node:assert/strict');
const test = require('node:test');
const { modules, hooks } = require('./annualReportHelpers.cjs');

const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
const reactFor = harness => ({ ...harness.react, useCallback: fn => fn, useMemo: fn => fn() });
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

test('session errors returned by the SDK and thrown failures both produce retryable errors', async () => {
  const load = modules();
  const { loadInitialSession } = load('src/hooks/sessionState.ts');
  for (const getSession of [
    async () => ({ data: { session: null }, error: new Error('offline') }),
    async () => { throw new Error('offline'); },
  ]) {
    const state = await loadInitialSession(getSession, new AbortController().signal);
    assert.equal(state.isLoading, false);
    assert.ok(state.errorMessage);
  }
});

test('unresponsive session times out and a later completion cannot change the result', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const load = modules();
  const { StartupCheck, StartupCopy } = load('src/constants/startup.ts');
  const request = deferred();
  const result = load('src/hooks/sessionState.ts').loadInitialSession(() => request.promise, new AbortController().signal);
  await flush();
  t.mock.timers.tick(StartupCheck.timeoutMs);
  const state = await result;
  assert.equal(state.errorMessage, StartupCopy.timedOut);
  request.resolve({ data: { session: { user: { id: 'late' } } } });
  await flush();
  assert.equal(state.session, null);
});

function profileSetup() {
  const harness = hooks();
  const requests = [];
  const writes = [];
  const load = modules({
    react: reactFor(harness),
    'src/lib/appStorage.ts': { appStorage: { getItem: () => null, setItem: (...args) => writes.push(args) } },
    'src/lib/profiles.ts': { fetchOwnProfileDisplayName: (_, signal) => {
      const request = { ...deferred(), signal };
      requests.push(request);
      return request.promise;
    } },
  });
  const { useAuthOnboarding } = load('src/hooks/useAuthOnboarding.ts');
  const render = () => harness.render(() => useAuthOnboarding({ userId: 'test', fallbackDisplayName: '' }));
  return { render, requests, writes, load, unmount: harness.unmount };
}

test('profile failure does not imply missing nickname; retry can confirm missing nickname', async () => {
  const app = profileSetup();
  assert.equal(app.render().step, null);
  await flush();
  app.requests[0].reject(new Error('offline'));
  await flush();
  let state = app.render();
  assert.ok(state.errorMessage);
  assert.equal(state.step, null);
  assert.equal(state.isLoading, false);
  assert.equal(app.writes.length, 0);
  state.retry();
  assert.equal(app.render().isLoading, true);
  await flush();
  app.requests[1].resolve('');
  await flush();
  state = app.render();
  assert.equal(state.errorMessage, null);
  assert.equal(state.step, 'nickname');
  app.unmount();
});

test('profile timeout aborts the request; late response cannot overwrite a successful retry', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const app = profileSetup();
  const { StartupCheck, StartupCopy } = app.load('src/constants/startup.ts');
  app.render();
  await flush();
  t.mock.timers.tick(StartupCheck.timeoutMs);
  await flush();
  const failed = app.render();
  assert.equal(failed.errorMessage, StartupCopy.timedOut);
  assert.equal(failed.step, null);
  assert.equal(app.requests[0].signal.aborted, true);
  failed.retry();
  app.render();
  await flush();
  app.requests[1].resolve('existing name');
  await flush();
  assert.equal(app.render().errorMessage, null);
  app.requests[0].resolve('');
  await flush();
  assert.equal(app.render().step, null);
  assert.equal(app.writes.length, 1);
  app.unmount();
});

test('unmount cancels pending profile request and ignores later data', async () => {
  const app = profileSetup();
  app.render();
  await flush();
  app.unmount();
  assert.equal(app.requests[0].signal.aborted, true);
  app.requests[0].resolve('late name');
  await flush();
  assert.equal(app.writes.length, 0);
});

test('session retry recovers and ignores stale INITIAL_SESSION events while failed', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const harness = hooks();
  const requests = [];
  let authEvent;
  const load = modules({
    react: reactFor(harness),
    'react-native': { Platform: { OS: 'web' } },
    'src/lib/supabase.ts': { supabase: { auth: {
      getSession: () => { const request = deferred(); requests.push(request); return request.promise; },
      onAuthStateChange: callback => { authEvent = callback; return { data: { subscription: { unsubscribe() {} } } }; },
    } } },
  });
  const { useSupabaseSession } = load('src/hooks/useSupabaseSession.ts');
  const render = () => harness.render(useSupabaseSession);
  render();
  await flush();
  t.mock.timers.tick(load('src/constants/startup.ts').StartupCheck.timeoutMs);
  await flush();
  authEvent('INITIAL_SESSION', null);
  assert.ok(render().errorMessage);
  render().retry();
  assert.equal(render().isLoading, true);
  await flush();
  const session = { user: { id: 'current' } };
  requests[1].resolve({ data: { session }, error: null });
  await flush();
  assert.equal(render().session, session);
  requests[0].resolve({ data: { session: null } });
  await flush();
  assert.equal(render().session, session);
  authEvent('SIGNED_OUT', null);
  assert.equal(render().session, null);
  harness.unmount();
});
