const assert = require("node:assert/strict");
const test = require("node:test");
const { modules } = require("./annualReportHelpers.cjs");
const { resolveCategoryGridScrollY } = modules()("src/lib/categoryGrid.ts");

test("moving a tile that remains visible preserves the user's scroll position", () => {
  assert.equal(resolveCategoryGridScrollY(6, 60, 4, 10, 200), 10);
});

test("wrapping forward to an offscreen row scrolls only enough to reveal the full tile", () => {
  assert.equal(resolveCategoryGridScrollY(12, 60, 4, 0, 200), 58);
});

test("moving backward above the viewport reveals the selected row", () => {
  assert.equal(resolveCategoryGridScrollY(11, 60, 4, 198, 200), 132);
});

test("a wider grid uses the new row positions when keeping the selected tile visible", () => {
  assert.equal(resolveCategoryGridScrollY(11, 60, 6, 132, 120), 66);
});
