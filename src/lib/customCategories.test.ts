import { describe, expect, it } from "vitest";

import { mergeCustomCategoryOrder, resolveCustomCategoryError } from "./customCategories";

const baseCategories = [
  { iconName: "shopping-cart", id: "food", label: "식비", source: "system", type: "expense" },
  { iconName: "navigation", id: "transport", label: "교통", source: "system", type: "expense" },
] as const;

describe("mergeCustomCategoryOrder", () => {
  it("replaces visible custom positions with the saved custom order", () => {
    const orderedCategories = [
      baseCategories[0],
      { iconName: "coffee", id: "custom-1", label: "커피값", source: "custom", type: "expense" },
      baseCategories[1],
      { iconName: "gift", id: "custom-2", label: "선물", source: "custom", type: "expense" },
    ] as const;
    const nextCustomCategories = [
      { iconName: "gift", id: "custom-2", label: "선물", source: "custom", type: "expense" },
      { iconName: "coffee", id: "custom-1", label: "커피값", source: "custom", type: "expense" },
    ] as const;

    expect(mergeCustomCategoryOrder(orderedCategories, nextCustomCategories)).toEqual([
      baseCategories[0],
      nextCustomCategories[0],
      baseCategories[1],
      nextCustomCategories[1],
    ]);
  });
});

describe("resolveCustomCategoryError", () => {
  it("rejects duplicate labels against base categories", () => {
    expect(
      resolveCustomCategoryError(baseCategories, [
        { iconName: "grid", id: "custom-1", label: "식비", source: "custom", type: "expense" },
      ]),
    ).toBe("같은 분류 이름은 사용할 수 없어요.");
  });

  it("rejects blank labels", () => {
    expect(
      resolveCustomCategoryError(baseCategories, [
        { iconName: "grid", id: "custom-1", label: "   ", source: "custom", type: "expense" },
      ]),
    ).toBe("분류 이름을 입력해 주세요.");
  });
});
