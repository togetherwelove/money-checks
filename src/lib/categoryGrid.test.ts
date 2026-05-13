import { describe, expect, it } from "vitest";

import {
  resolveCategoryGridHeight,
  resolveCategoryGridMetrics,
  resolveCategoryGridPosition,
} from "./categoryGrid";

describe("categoryGrid", () => {
  it("builds grid positions by row and column", () => {
    expect(resolveCategoryGridPosition(4, 58, 5)).toEqual({ x: 256, y: 0 });
  });

  it("computes the full grid height", () => {
    expect(resolveCategoryGridHeight(10, 58, 5)).toBe(122);
  });

  it("resolves dynamic grid metrics from container width", () => {
    expect(resolveCategoryGridMetrics(344)).toEqual({ cellSize: 64, columns: 5 });
  });
});
