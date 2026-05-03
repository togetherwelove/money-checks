import { resolveMonthOffsetFromPageIndex } from "./monthCalendarScrollSnap";

describe("resolveMonthOffsetFromPageIndex", () => {
  it("keeps the current month when snapped to the center page", () => {
    expect(resolveMonthOffsetFromPageIndex(1)).toBe(0);
  });

  it("moves to the previous month when snapped to the previous page", () => {
    expect(resolveMonthOffsetFromPageIndex(0)).toBe(-1);
  });

  it("moves to the next month when snapped to the next page", () => {
    expect(resolveMonthOffsetFromPageIndex(2)).toBe(1);
  });
});
