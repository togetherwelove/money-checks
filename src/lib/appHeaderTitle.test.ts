import { showsCalendarReturnAction } from "./appHeaderTitle";

describe("appHeaderTitle", () => {
  it("only shows the calendar return action outside the calendar screen", () => {
    expect(showsCalendarReturnAction("calendar")).toBe(false);
    expect(showsCalendarReturnAction("entry")).toBe(true);
  });
});
