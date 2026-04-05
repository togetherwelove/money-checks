import { buildMonthlyLedger } from "../../utils/calendar";
import { getCalendarWeekCount, getVisibleCalendarDays } from "./calendarWeekCount";

describe("calendarWeekCount", () => {
  it("uses the visible current-month weeks only", () => {
    const february = buildMonthlyLedger("2026-02", []);
    const august = buildMonthlyLedger("2026-08", []);

    expect(getCalendarWeekCount(february.days)).toBe(4);
    expect(getCalendarWeekCount(august.days)).toBe(6);
    expect(getVisibleCalendarDays(february.days)).toHaveLength(28);
    expect(getVisibleCalendarDays(august.days)).toHaveLength(42);
  });
});
