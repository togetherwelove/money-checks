import { describe, expect, it } from "vitest";

import { EXPENSE_CATEGORY_LABELS } from "../constants/expenseCategories";
import { INCOME_CATEGORY_LABELS } from "../constants/incomeCategories";
import { recommendCategory } from "./categoryRecommendation";

describe("recommendCategory", () => {
  it("recommends daily life for laundry merchants", () => {
    expect(recommendCategory({ content: "승진세탁소", entryType: "expense" })).toEqual({
      category: EXPENSE_CATEGORY_LABELS.living,
      matchedKeyword: "세탁소",
    });
  });

  it("recommends dining for delivery merchants", () => {
    expect(recommendCategory({ content: "배달의민족", entryType: "expense" })).toEqual({
      category: EXPENSE_CATEGORY_LABELS.dining,
      matchedKeyword: "배달",
    });
  });

  it("recommends salary for payroll income", () => {
    expect(recommendCategory({ content: "4월 급여", entryType: "income" })).toEqual({
      category: INCOME_CATEGORY_LABELS.salary,
      matchedKeyword: "급여",
    });
  });

  it("returns null when no label matches", () => {
    expect(recommendCategory({ content: "알 수 없는 내용", entryType: "expense" })).toBeNull();
  });
});
