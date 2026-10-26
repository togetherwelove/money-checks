const assert = require("node:assert/strict");
const { test } = require("node:test");
const { modules, currencyMock } = require("./annualReportHelpers.cjs");
const { getEntryComposerInvalidField } = modules({ 'src/lib/currencyPreference.ts': currencyMock })("src/utils/entryComposer.ts");
const completed = { amount: "8500", content: "점심 식사", categoryId: "food" };

test("incomplete and invalid amounts never become saveable", () => {
  for (const amount of ["", "0", "-1", "Infinity", "NaN"]) {
    assert.equal(getEntryComposerInvalidField({ ...completed, amount }), "amount");
  }
  assert.equal(getEntryComposerInvalidField({ ...completed, content: "  " }), "content");
  assert.equal(getEntryComposerInvalidField({ ...completed, categoryId: "  " }), "category");
  assert.equal(getEntryComposerInvalidField(completed), null);
});
