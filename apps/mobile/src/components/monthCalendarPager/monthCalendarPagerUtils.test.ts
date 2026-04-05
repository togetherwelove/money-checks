import { resolveMonthOffset } from "./monthCalendarGesture";

describe("resolveMonthOffset", () => {
  it("ignores tap-sized movement", () => {
    expect(resolveMonthOffset(18, 0.05, 240)).toBe(0);
  });

  it("changes month on sufficient drag distance", () => {
    expect(resolveMonthOffset(-64, 0.1, 240)).toBe(1);
    expect(resolveMonthOffset(64, 0.1, 240)).toBe(-1);
  });

  it("changes month on fast swipe velocity", () => {
    expect(resolveMonthOffset(-12, -0.5, 240)).toBe(1);
    expect(resolveMonthOffset(12, 0.5, 240)).toBe(-1);
  });
});
