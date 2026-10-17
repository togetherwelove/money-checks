const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");
function load(file) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, { exports, require: (name) => name.includes("currencyPreference")
    ? { resolveDisplayCurrency: () => "KRW" }
    : load(path.join(path.dirname(file), `${name}.ts`)) });
  return exports;
}
const { buildChartAxis } = load("src/utils/chartAxis.ts");
const { formatChartAxisCurrency } = load("src/utils/currency.ts");
test("round currency intervals cover the data and share one scale", () => {
  for (const [amount, expected] of [[19000, [20000, 10000, 0]], [97000, [100000, 50000, 0]], [840000, [1000000, 500000, 0]]]) {
    const axis = buildChartAxis(amount, 3);
    assert.deepEqual(Array.from(axis.ticks, (tick) => tick.amount), expected);
    assert.ok(axis.maximum >= amount);
  }
});
test("empty and small amounts have valid unique ticks", () => {
  for (const amount of [0, 1, 7, 950, 120000000]) {
    const axis = buildChartAxis(amount, 3);
    assert.ok(axis.maximum >= amount);
    assert.equal(new Set(axis.ticks.map((tick) => tick.amount)).size, axis.ticks.length);
    assert.equal(axis.ticks.at(-1).amount, 0);
  }
});
test("axis currency uses readable ten-thousand units without rounding away values", () => {
  for (const [amount, text] of [[0, "0"], [10000, "1만"], [15000, "1.5만"], [150000, "15만"], [1000000, "100만"], [100000000, "1억"]]) {
    assert.equal(formatChartAxisCurrency(amount), text);
  }
});
