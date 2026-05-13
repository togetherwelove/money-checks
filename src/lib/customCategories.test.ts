import { describe, expect, it } from "vitest";

import { resolveCustomCategoryError } from "./customCategories";

const baseCategories = [
  { iconName: "shopping-cart", id: "food", label: "식비", source: "system", type: "expense" },
  { iconName: "navigation", id: "transport", label: "교통", source: "system", type: "expense" },
] as const;

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
