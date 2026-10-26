const assert = require('node:assert/strict');
const test = require('node:test');
const { modules } = require('./annualReportHelpers.cjs');
const flush = () => new Promise(setImmediate);
const locked = () => Error("Calling the 'getValueWithKeyAsync' function has failed: User interaction is not allowed.");

function setup(initialState = 'active') {
  const values = new Map(), calls = [], listeners = new Set();
  const appState = { currentState: initialState,
    addEventListener: (_event, callback) => { listeners.add(callback); return { remove: () => listeners.delete(callback) }; },
  };
  const fixture = { values, calls, listeners, read: key => values.get(key) ?? null,
    setRead(read) { fixture.read = read; },
    transition(state) { appState.currentState = state; listeners.forEach(callback => callback(state)); },
  };
  const access = (operation, args) => {
    assert.equal(appState.currentState, 'active', 'SecureStore must only be accessed while active');
    calls.push({ operation, args });
  };
  const load = modules({
    'react-native': { AppState: appState },
    'expo-secure-store': {
      getItemAsync: async (...args) => { access('get', args); return fixture.read(args[0]); },
      setItemAsync: async (...args) => { access('set', args); values.set(args[0], args[1]); },
      deleteItemAsync: async (...args) => { access('delete', args); values.delete(args[0]); },
    },
    'src/constants/authStorage.ts': { AuthStorageConfig: {
      chunkLength: 4, chunkPrefix: '__chunks__:', chunkSeparator: '__chunk__',
      accessRetryDelayMs: 1, accessRetryLimit: 3, interactionNotAllowedMessage: 'User interaction is not allowed',
    } },
  });
  return { ...fixture, storage: load('src/lib/supabaseStorage.native.ts').authStorage,
    secure: load('src/lib/foregroundSecureStore.native.ts').foregroundSecureStore };
}

test('background auth reads share one resume listener and never become a missing session', async () => {
  const f = setup('background'); f.values.set('session', 'token');
  const first = f.storage.getItem('session'), second = f.storage.getItem('session');
  await flush();
  assert.equal(f.calls.length, 0);
  assert.equal(f.listeners.size, 1);
  f.transition('inactive'); await flush();
  assert.equal(f.calls.length, 0);
  f.transition('active');
  assert.deepEqual(await Promise.all([first, second]), ['token', 'token']);
  assert.equal(f.listeners.size, 0);
  assert.ok(f.calls.every(call => call.operation === 'get' && call.args.length === 1));
});

test('an in-flight screen-lock error waits for foreground and retries the same secure read', async () => {
  const f = setup(); let reads = 0;
  f.setRead(() => { reads++; if (reads === 1) { f.transition('background'); throw locked(); } return 'token'; });
  const pending = f.storage.getItem('session'); await flush();
  assert.equal(reads, 1);
  assert.equal(f.listeners.size, 1);
  f.transition('active');
  assert.equal(await pending, 'token');
  assert.equal(reads, 2);
  assert.equal(f.listeners.size, 0);
});

test('foreground keychain warmup is retried, while persistent or unrelated failures remain errors', async () => {
  const f = setup(); let reads = 0;
  f.setRead(() => { reads++; if (reads < 3) throw locked(); return 'token'; });
  assert.equal(await f.storage.getItem('session'), 'token');
  assert.equal(reads, 3);
  reads = 0;
  f.setRead(() => { reads++; throw locked(); });
  await assert.rejects(f.storage.getItem('session'), /User interaction is not allowed/);
  assert.equal(reads, 4);
  const otherError = Error('Keychain corrupted'); reads = 0;
  f.setRead(() => { reads++; throw otherError; });
  await assert.rejects(f.storage.getItem('session'), error => error === otherError);
  assert.equal(reads, 1);
  assert.equal(f.calls.some(call => call.operation === 'delete'), false);
  assert.equal(f.listeners.size, 0);
});

test('chunked sessions retain all chunks across a lock, including secure writes and sign-out cleanup', async () => {
  const f = setup('inactive');
  const writing = f.storage.setItem('session', 'abcdefghijkl'); await flush();
  assert.equal(f.calls.length, 0);
  f.transition('active'); await writing;
  assert.equal(await f.storage.getItem('session'), 'abcdefghijkl');
  let lockOnce = true;
  f.setRead(key => {
    if (key.endsWith('__chunk__1') && lockOnce) { lockOnce = false; f.transition('background'); throw locked(); }
    return f.values.get(key) ?? null;
  });
  const reading = f.storage.getItem('session'); await flush();
  assert.equal(f.listeners.size, 1);
  f.transition('active');
  assert.equal(await reading, 'abcdefghijkl');
  f.transition('background');
  const beforeDelete = f.calls.length;
  const removing = f.storage.removeItem('session'); await flush();
  assert.equal(f.calls.length, beforeDelete);
  f.transition('active'); await removing;
  assert.equal(f.values.size, 0);
  assert.equal(f.listeners.size, 0);
});

test('rapid foreground/background transitions keep access deferred and release listeners after resume', async () => {
  const f = setup(null); f.values.set('session', 'token');
  const pending = f.secure.getItemAsync('session');
  f.transition('active'); f.transition('background'); await flush();
  assert.equal(f.calls.length, 0);
  assert.equal(f.listeners.size, 1);
  f.transition('active');
  assert.equal(await pending, 'token');
  assert.equal(f.listeners.size, 0);
});
