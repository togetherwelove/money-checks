const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

function load(file, mocks = {}, globals = {}) {
  const exports = {};
  const { outputText } = ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  vm.runInNewContext(outputText, { exports, Request, Response, console, ...globals, require: (name) => {
    if (name in mocks) return mocks[name];
    throw new Error(`Unexpected dependency: ${name}`);
  } });
  return exports;
}
const keyModule = load("supabase/functions/_shared/supabaseAdminKey.ts");
const resolve = (env) => keyModule.resolveSupabaseAdminKey((name) => env[name]);

test("admin key selects default or explicitly named key, never the JSON dictionary", () => {
  const env = { SUPABASE_SECRET_KEYS: JSON.stringify({ default: "default-secret", billing: "billing-secret" }) };
  assert.equal(resolve(env), "default-secret");
  assert.equal(resolve({ ...env, SUPABASE_SECRET_KEY_NAME: "billing" }), "billing-secret");
  assert.equal(resolve({ ...env, SUPABASE_SECRET_KEY_NAME: "missing" }), "");
});

test("invalid maps fail closed without falling back to another credential", () => {
  for (const raw of ["{bad", "null", "[]", '"secret"', "{}", '{"default":42}', '{"default":{}}', '{"default":"  "}']) {
    assert.equal(resolve({ SUPABASE_SECRET_KEYS: raw, SUPABASE_SERVICE_ROLE_KEY: "legacy-secret" }), "");
  }
  assert.equal(resolve({ SUPABASE_SECRET_KEYS: "{}", SUPABASE_SECRET_KEY_NAME: "toString" }), "");
});

test("older and local runtimes can use a single or legacy key when the map is absent", () => {
  assert.equal(resolve({ SUPABASE_SECRET_KEY: " single-secret " }), "single-secret");
  assert.equal(resolve({ SUPABASE_SERVICE_ROLE_KEY: "legacy-secret" }), "legacy-secret");
  assert.equal(resolve({}), "");
});

for (const [folder, handler] of [
  ["sync-revenuecat-subscription", "handleSyncRevenueCatSubscriptionRequest"],
  ["send-push-notifications", "handleSendPushNotificationsRequest"],
  ["delete-account", "handleDeleteAccountRequest"],
  ["revenuecat-webhook", "handleRevenueCatWebhookRequest"],
]) {
  test(`${folder} passes the parsed key to its client and handler`, async () => {
    let serve, clientKey, handlerKey;
    const index = `supabase/functions/${folder}/index.ts`;
    const handlerImport = fs.readFileSync(path.join(__dirname, "..", index), "utf8").match(/from "(\.\/[^\"]+Handler\.ts)"/)[1];
    load(index, {
      "https://esm.sh/@supabase/supabase-js@2": { createClient: (_, key) => { clientKey = key; return {}; } },
      "../_shared/supabaseAdminKey.ts": keyModule,
      [handlerImport]: { [handler]: async (_, options) => { handlerKey = options.serviceRoleKey; options.createAdminClient(); return new Response("ok"); } },
    }, { Deno: { env: { get: (name) => name === "SUPABASE_SECRET_KEYS" ? '{"default":"test-secret"}' : undefined }, serve: (callback) => { serve = callback; } } });
    assert.equal((await serve(new Request("https://test.invalid"))).status, 200);
    assert.equal(clientKey, handlerKey);
    assert.equal(clientKey, "test-secret");
  });
}
