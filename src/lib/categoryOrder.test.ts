import { describe, expect, it } from "vitest";

import {
  moveCategoryItem,
  resolveCategoryOrder,
  resolvePreviewCategoryOrder,
} from "./categoryOrder";

describe("resolveCategoryOrder", () => {
  it("keeps stored categories first and appends new defaults", () => {
    expect(resolveCategoryOrder(["식비", "교통", "생활"], ["교통", "식비"])).toEqual([
      "교통",
      "식비",
      "생활",
    ]);
  });

  it("drops categories that no longer exist", () => {
    expect(resolveCategoryOrder(["급여", "부수입"], ["기타", "부수입"])).toEqual([
      "부수입",
      "급여",
    ]);
  });
});

describe("moveCategoryItem", () => {
  it("moves a category to the tapped position", () => {
    expect(moveCategoryItem(["식비", "교통", "생활", "쇼핑"], 0, 2)).toEqual([
      "교통",
      "생활",
      "식비",
      "쇼핑",
    ]);
  });

  it("returns the original order for invalid indexes", () => {
    expect(moveCategoryItem(["식비", "교통"], -1, 1)).toEqual(["식비", "교통"]);
  });
});

describe("resolvePreviewCategoryOrder", () => {
  it("keeps row-crossing preview stable from the original drag order", () => {
    expect(resolvePreviewCategoryOrder(["A", "B", "C", "D", "E", "F", "G", "H"], "B", 6)).toEqual([
      "A",
      "C",
      "D",
      "E",
      "F",
      "G",
      "B",
      "H",
    ]);
  });
});
