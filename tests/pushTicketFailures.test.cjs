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
  vm.runInNewContext(outputText, {
    exports, Request, Response, console: { error: () => {} }, ...globals,
    require: (name) => { if (name in mocks) return mocks[name]; throw new Error(name); },
  });
  return exports;
}

async function send(payload, { status = 200, tokenError = null, cleanupError = null } = {}) {
  const deleted = [];
  let fetches = 0;
  const { handleSendPushNotificationsRequest } = load("supabase/functions/send-push-notifications/sendPushNotificationsHandler.ts", {
    "../_shared/i18n/translate.ts": { translate: (_, key) => key },
    "./expoPushTickets.ts": load("supabase/functions/send-push-notifications/expoPushTickets.ts"),
  }, { fetch: async () => { fetches++; return new Response(JSON.stringify(payload), { status }); } });
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: "sender" } }, error: null }) },
    rpc: async () => ({ data: true, error: null }),
    from: (table) => {
      const query = {
        select: () => query,
        in: () => query,
        delete: () => ({ in: async (_, tokens) => { deleted.push(...tokens); return { error: cleanupError }; } }),
        then: (resolve) => resolve({
          data: table === "push_device_tokens"
            ? ["first", "second"].map((id) => ({ expo_push_token: `ExpoPushToken[${id}]` })) : [],
          error: table === "push_device_tokens" ? tokenError : null,
        }),
      };
      return query;
    },
  };
  const response = await handleSendPushNotificationsRequest(new Request("https://test.invalid", {
    method: "POST", headers: { Authorization: "Bearer test" },
    body: JSON.stringify({ route: "direct-targets", targetUserIds: ["sender"], event: { type: "member_joined_book" } }),
  }), { createAdminClient: () => client, serviceRoleKey: "test", supabaseUrl: "https://test.invalid" });
  return { status: response.status, body: await response.json(), deleted, fetches };
}

test("HTTP 200 ticket errors return failure and remove only unregistered tokens", async () => {
  const result = await send({ data: [
    { status: "error", details: { error: "DeviceNotRegistered" } },
    { status: "error", details: { error: "MessageRateExceeded" } },
  ] });
  assert.equal(result.status, 502);
  assert.equal(result.body.success, false);
  assert.equal(result.body.sentCount, 0);
  assert.equal(result.body.failedCount, 2);
  assert.deepEqual(result.deleted, ["ExpoPushToken[first]"]);
});

test("partial failure preserves the accepted count even when token cleanup fails", async () => {
  const result = await send({ data: [
    { status: "ok", id: "ticket" },
    { status: "error", details: { error: "DeviceNotRegistered" } },
  ] }, { cleanupError: new Error("database unavailable") });
  assert.equal(result.status, 502);
  assert.equal(result.body.acceptedCount, 1);
  assert.equal(result.body.failedCount, 1);
});

test("all accepted tickets succeed without deleting tokens", async () => {
  const result = await send({ data: [{ status: "ok", id: "first" }, { status: "ok", id: "second" }] });
  assert.equal(result.status, 200);
  assert.equal(result.body.success, true);
  assert.equal(result.body.acceptedCount, 2);
  assert.deepEqual(result.deleted, []);
});

test("malformed or missing tickets never report success or delete tokens", async () => {
  for (const payload of [null, {}, { data: [] }, { data: [{ status: "ok", id: "first" }] },
    { data: [{ status: "ok" }, null] }, { errors: [{ message: "invalid request" }] }]) {
    const result = await send(payload);
    assert.equal(result.status, 502);
    assert.equal(result.body.success, false);
    assert.equal(result.body.sentCount, 0);
    assert.deepEqual(result.deleted, []);
  }
});

test("upstream HTTP failure and token query failure are not successful no-ops", async () => {
  assert.equal((await send({ error: "unavailable" }, { status: 503 })).status, 502);
  const result = await send({}, { tokenError: new Error("query failed") });
  assert.equal(result.status, 500);
  assert.equal(result.fetches, 0);
});
