import {
  resolveMonthOffsetFromPageIndex,
  resolvePageIndexFromScrollOffset,
} from "./monthCalendarScrollSnap";

describe("resolvePageIndexFromScrollOffset", () => {
  it("clamps the snapped page index inside the three-page window", () => {
    expect(resolvePageIndexFromScrollOffset(-80, 240)).toBe(0);
    expect(resolvePageIndexFromScrollOffset(240, 240)).toBe(1);
    expect(resolvePageIndexFromScrollOffset(999, 240)).toBe(2);
  });
});

describe("resolveMonthOffsetFromPageIndex", () => {
  it("keeps the current month when snapped to the center page", () => {
    expect(resolveMonthOffsetFromPageIndex(1)).toBe(0);
  });

  it("moves to the previous month when snapped to the top page", () => {
    expect(resolveMonthOffsetFromPageIndex(0)).toBe(-1);
  });

  it("moves to the next month when snapped to the bottom page", () => {
    expect(resolveMonthOffsetFromPageIndex(2)).toBe(1);
  });
});
