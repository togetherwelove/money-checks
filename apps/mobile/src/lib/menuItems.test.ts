import { AppMessages } from "../constants/messages";

import { buildAppMenuItems } from "./menuItems";

describe("buildAppMenuItems", () => {
  it("includes calendar and entry navigation in the drawer", () => {
    expect(buildAppMenuItems(false)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: AppMessages.calendarTab,
          targetScreen: "calendar",
        }),
        expect.objectContaining({
          label: AppMessages.entryTab,
          targetScreen: "entry",
        }),
      ]),
    );
  });

  it("adds notification settings only when enabled", () => {
    expect(buildAppMenuItems(false)).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targetScreen: "notification-settings",
        }),
      ]),
    );

    expect(buildAppMenuItems(true)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: AppMessages.menuNotificationSettingsTitle,
          targetScreen: "notification-settings",
        }),
      ]),
    );
  });
});
