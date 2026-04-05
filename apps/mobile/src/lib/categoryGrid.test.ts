import { describe, expect, it } from "vitest";

import {
  resolveCategoryCellSize,
  resolveCategoryDropIndex,
  resolveCategoryGridHeight,
  resolveCategoryGridPosition,
} from "./categoryGrid";

describe("categoryGrid", () => {
  it("builds grid positions by row and column", () => {
    expect(resolveCategoryGridPosition(4, 90)).toEqual({ x: 96, y: 96 });
  });

  it("computes the full grid height", () => {
    expect(resolveCategoryGridHeight(5, 90)).toBe(186);
  });

  it("clamps the drop index inside the visible grid", () => {
    expect(resolveCategoryDropIndex(280, 140, { left: 0, top: 0, width: 282 }, 90, 5)).toBe(4);
  });

  it("resolves a positive cell size from container width", () => {
    expect(resolveCategoryCellSize(282)).toBe(90);
  });
});
