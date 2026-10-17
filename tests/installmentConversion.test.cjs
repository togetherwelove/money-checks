const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");
function load(rpc) {
  const exports = {};
  const { outputText } = ts.transpileModule(fs.readFileSync(path.join(__dirname, "../src/lib/installmentConversion.ts"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  vm.runInNewContext(outputText, { exports, require: () => ({ supabase: { rpc } }) });
  return exports;
}
const entries = [1, 2, 3].map((id) => ({ id: String(id), amount: 100000, updatedAt: "2026-10-17T00:00:00Z" }));
test("preview preserves total and only excludes explicitly paid entries", () => {
  const { previewInstallmentConversion: preview } = load();
  assert.equal(preview(entries, []).totalAmount, 300000);
  assert.equal(preview(entries, ["1"]).totalAmount, 200000);
  assert.equal(preview(entries, ["1"]).paidCount, 1);
  assert.equal(preview(entries, ["1", "2", "3"]).remaining.length, 0);
  assert.equal(entries.length, 3);
});
test("conversion sends exact preview revision and selected payment date; failures propagate", async () => {
  let request;
  const api = load(async (name, params) => { request = { name, params }; return { error: null }; });
  await api.convertInstallmentToOneTime("book", "group", entries, ["1"], "2026-10-20");
  assert.equal(request.name, "convert_installment_to_one_time");
  assert.equal(request.params.conversion_date, "2026-10-20");
  assert.deepEqual(request.params.paid_entry_ids, ["1"]);
  assert.equal(request.params.expected_entries[0].updated_at, entries[0].updatedAt);
  const cause = new Error("stale snapshot");
  await assert.rejects(load(async () => ({ error: cause })).convertInstallmentToOneTime("book", "group", entries, [], "2026-10-20"), cause);
});
