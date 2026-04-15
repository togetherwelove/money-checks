import { NotificationUiCopy } from "../notifications/config/notificationCopy";
import { getAppHeaderTitle, showsCalendarReturnAction } from "./appHeaderTitle";

describe("appHeaderTitle", () => {
  it("returns header titles for non-calendar screens", () => {
    expect(getAppHeaderTitle("account")).toBe("계정");
    expect(getAppHeaderTitle("share")).toBe("가계부 공유");
    expect(getAppHeaderTitle("charts")).toBe("차트");
    expect(getAppHeaderTitle("entry")).toBe("입출금 등록");
    expect(getAppHeaderTitle("notification-settings")).toBe(NotificationUiCopy.screenTitle);
  });

  it("only shows the calendar return action outside the calendar screen", () => {
    expect(showsCalendarReturnAction("calendar")).toBe(false);
    expect(showsCalendarReturnAction("entry")).toBe(true);
  });
});
