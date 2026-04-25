import { showsBackNavigationAction } from "./appHeaderTitle";

describe("appHeaderTitle", () => {
  it("only shows the back navigation action outside the calendar screen", () => {
    expect(showsBackNavigationAction("calendar")).toBe(false);
    expect(showsBackNavigationAction("entry")).toBe(true);
  });
});
