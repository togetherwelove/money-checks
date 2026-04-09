import { resolveMonthOffsetFromScrollOffset } from "./monthCalendarScrollSnap";

describe("resolveMonthOffsetFromScrollOffset", () => {
  it("keeps the current month when snapped to the center page", () => {
    expect(resolveMonthOffsetFromScrollOffset(240, 240)).toBe(0);
    expect(resolveMonthOffsetFromScrollOffset(250, 240)).toBe(0);
  });

  it("moves to the previous month when snapped to the top page", () => {
    expect(resolveMonthOffsetFromScrollOffset(0, 240)).toBe(-1);
    expect(resolveMonthOffsetFromScrollOffset(96, 240)).toBe(-1);
  });

  it("moves to the next month when snapped to the bottom page", () => {
    expect(resolveMonthOffsetFromScrollOffset(480, 240)).toBe(1);
    expect(resolveMonthOffsetFromScrollOffset(384, 240)).toBe(1);
  });
});
