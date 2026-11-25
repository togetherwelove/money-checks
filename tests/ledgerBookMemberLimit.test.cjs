const assert = require("node:assert/strict");
const test = require("node:test");
const { modules, hooks } = require("./annualReportHelpers.cjs");

test("member capacity follows the owner tier, updates the own plan immediately, and ignores obsolete owner responses", async () => {
  const h = hooks(),
    requests = [];
  const load = modules({
    react: h.react,
    "src/lib/profiles.ts": {
      fetchProfileSubscriptionTier: (id, signal) =>
        new Promise((resolve, reject) => requests.push({ id, signal, resolve, reject })),
    },
  });
  const { useLedgerBookMemberLimit } = load("src/hooks/useLedgerBookMemberLimit.ts");
  const render = (owner, tier = "free", count = 1) =>
    h.render(() => useLedgerBookMemberLimit(owner, "me", tier, count));
  assert.equal(render("me"), 2);
  assert.equal(render("me", "plus"), 5);
  assert.equal(requests.length, 0);
  assert.equal(render("owner-a"), null);
  requests[0].resolve("plus");
  await new Promise(setImmediate);
  assert.equal(render("owner-a"), 5);
  assert.equal(render("owner-b", "plus"), null);
  requests[1].resolve("free");
  await new Promise(setImmediate);
  assert.equal(render("owner-b", "plus"), 2);
  render("owner-c");
  render("owner-d");
  assert.equal(requests[2].signal.aborted, true);
  requests[2].resolve("plus");
  await new Promise(setImmediate);
  assert.equal(render("owner-d"), null);
  requests[3].reject(new Error("offline"));
  await new Promise(setImmediate);
  assert.equal(render("owner-d"), null);
  render("owner-d", "free", 2);
  assert.equal(requests.length, 5);
  h.unmount();
  assert.equal(requests[4].signal.aborted, true);
});
