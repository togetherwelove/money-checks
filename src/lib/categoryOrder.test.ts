import { describe, expect, it } from "vitest";

import {
  moveCategoryItem,
  resolveCategoryOrder,
  resolvePreviewCategoryOrder,
} from "./categoryOrder";

const BASE_CATEGORIES = [
  { id: "food", label: "식비" },
  { id: "transport", label: "교통" },
  { id: "living", label: "생활" },
];

describe("resolveCategoryOrder", () => {
  it("keeps stored ids first and appends new defaults", () => {
    expect(resolveCategoryOrder(BASE_CATEGORIES, ["transport", "food"])).toEqual([
      { id: "transport", label: "교통" },
      { id: "food", label: "식비" },
      { id: "living", label: "생활" },
    ]);
  });

  it("drops ids that no longer exist", () => {
    expect(resolveCategoryOrder(BASE_CATEGORIES, ["unknown", "food"])).toEqual([
      { id: "food", label: "식비" },
      { id: "transport", label: "교통" },
      { id: "living", label: "생활" },
    ]);
  });
});

describe("moveCategoryItem", () => {
  it("moves a category to the tapped position", () => {
    expect(moveCategoryItem(BASE_CATEGORIES, 0, 2)).toEqual([
      { id: "transport", label: "교통" },
      { id: "living", label: "생활" },
      { id: "food", label: "식비" },
    ]);
  });
});

describe("resolvePreviewCategoryOrder", () => {
  it("keeps row-crossing preview stable from the original drag order", () => {
    const categories = ["A", "B", "C", "D", "E", "F", "G", "H"].map((id) => ({ id }));
    expect(resolvePreviewCategoryOrder(categories, "B", 6)).toEqual([
      { id: "A" },
      { id: "C" },
      { id: "D" },
      { id: "E" },
      { id: "F" },
      { id: "G" },
      { id: "B" },
      { id: "H" },
    ]);
  });
});
