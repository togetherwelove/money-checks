const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, dependencies = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, Request, Response, console, require(name) {
    if (name in dependencies) return dependencies[name];
    throw Error(`Unexpected dependency: ${name}`);
  } });
  return exports;
}
const messages = load('supabase/functions/delete-account/appleDeletionMessages.ts');
const { handleDeleteAccountRequest } = load('supabase/functions/delete-account/deleteAccountHandler.ts', {
  './appleDeletionMessages.ts': messages,
});

function fixture({ apple = true, shared = false, revokeFails = false } = {}) {
  const calls = [];
  const user = { id: 'supabase-user', identities: apple ? [
    { provider: 'apple', id: 'legacy-provider-id', identity_data: { sub: 'apple-subject' } },
  ] : [{ provider: 'email' }] };
  const admin = {
    auth: { getUser: async () => ({ data: { user }, error: null }),
      admin: { deleteUser: async id => { calls.push(['delete', id]); return { error: null }; } } },
    from: table => table === 'ledger_books'
      ? { select: () => ({ eq: async () => ({ data: shared ? [{ id: 'book' }] : [], error: null }) }) }
      : { select: () => ({ in: () => ({ neq: () => ({ limit: async () => ({ data: [{ book_id: 'book' }], error: null }) }) }) }) },
  };
  const options = { supabaseUrl: 'https://test.invalid', serviceRoleKey: 'test-secret',
    createAdminClient: () => admin,
    revokeAppleAuthorization: async (code, subject) => {
      calls.push(['revoke', code, subject]);
      if (revokeFails) throw Error('provider unavailable');
    },
  };
  return { calls, options, request: body => new Request('https://test.invalid/delete-account', {
    method: 'POST', headers: { Authorization: 'Bearer test-token', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) };
}

test('Apple deletion revokes the authenticated identity before deleting the Supabase account', async () => {
  const f = fixture();
  const response = await handleDeleteAccountRequest(f.request({ appleAuthorizationCode: 'fresh-code' }), f.options);
  assert.equal(response.status, 200);
  assert.deepEqual(f.calls, [['revoke', 'fresh-code', 'apple-subject'], ['delete', 'supabase-user']]);
});

test('missing Apple authorization or failed revocation never deletes the account', async () => {
  for (const [body, revokeFails, status] of [[{}, false, 400], [{ appleAuthorizationCode: 'code' }, true, 502]]) {
    const f = fixture({ revokeFails });
    const response = await handleDeleteAccountRequest(f.request(body), f.options);
    assert.equal(response.status, status);
    assert.equal(f.calls.some(([kind]) => kind === 'delete'), false);
  }
});

test('shared-ledger ownership is checked before consuming a single-use Apple code', async () => {
  const f = fixture({ shared: true });
  assert.equal((await handleDeleteAccountRequest(f.request({ appleAuthorizationCode: 'code' }), f.options)).status, 409);
  assert.deepEqual(f.calls, []);
});

test('email account deletion does not require Apple authorization', async () => {
  const f = fixture({ apple: false });
  assert.equal((await handleDeleteAccountRequest(f.request({}), f.options)).status, 200);
  assert.deepEqual(f.calls, [['delete', 'supabase-user']]);
});

test('missing server revocation support preserves the account', async () => {
  const f = fixture();
  f.options.revokeAppleAuthorization = undefined;
  const response = await handleDeleteAccountRequest(f.request({ appleAuthorizationCode: 'code' }), f.options);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, messages.AppleDeletionErrors.configuration);
  assert.deepEqual(f.calls, []);
});

test('Apple reauthentication is skipped for email accounts and cancellation sends no code', async () => {
  const copy = load('src/constants/accountDeletion.ts');
  let user = { identities: [{ provider: 'email' }] }, prompts = 0, cancelled = false;
  const { authorizeAppleAccountDeletion } = load('src/lib/auth/appleAccountDeletion.native.ts', {
    '../../constants/accountDeletion': copy,
    '../appPlatform': { appPlatform: { isIOS: true } },
    '../supabase': { supabase: { auth: { getUser: async () => ({ data: { user }, error: null }) } } },
    'expo-apple-authentication': { signInAsync: async () => {
      prompts++;
      if (cancelled) throw Error('cancelled');
      return { authorizationCode: 'fresh-code' };
    } },
  });
  assert.equal(await authorizeAppleAccountDeletion(), undefined);
  assert.equal(prompts, 0);
  user = { identities: [{ provider: 'apple' }] };
  assert.equal(await authorizeAppleAccountDeletion(), 'fresh-code');
  cancelled = true;
  await assert.rejects(authorizeAppleAccountDeletion(), /Apple/);
});
