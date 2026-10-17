const assert = require("node:assert/strict");
const { test } = require("node:test");
const { getEntryComposerInvalidField, getEntryComposerNextStep } = require("../src/utils/entryComposer.ts");

const completed = { amount: "8500", content: "점심 식사", categoryId: "food" };

test("new entry moves from amount to content to category", () => {
  assert.equal(getEntryComposerNextStep({ ...completed, content: "", categoryId: "" }, "amount", false), "content");
  assert.equal(getEntryComposerNextStep({ ...completed, categoryId: "" }, "content", false), "category");
});

test("editing completed fields returns to review", () => {
  for (const field of ["amount", "content", "note"]) {
    assert.equal(getEntryComposerNextStep(completed, field, true), "review");
  }
});

test("changing income/expense requires selecting the new category", () => {
  assert.equal(getEntryComposerNextStep({ ...completed, categoryId: "" }, "amount", true), "category");
});

test("empty optional note can return directly to review", () => {
  assert.equal(getEntryComposerNextStep(completed, "note", false), "review");
});

test("incomplete and invalid amounts never become saveable", () => {
  for (const amount of ["", "0", "-1", "Infinity", "NaN"]) {
    assert.equal(getEntryComposerInvalidField({ ...completed, amount }), "amount");
  }
  assert.equal(getEntryComposerInvalidField({ ...completed, content: "  " }), "content");
  assert.equal(getEntryComposerInvalidField({ ...completed, categoryId: "  " }), "category");
  assert.equal(getEntryComposerInvalidField(completed), null);
});
