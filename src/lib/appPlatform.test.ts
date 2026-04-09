import { createAppPlatform } from "./appPlatformConfig";

describe("createAppPlatform", () => {
  it("resolves web-specific capabilities in one place", () => {
    const platform = createAppPlatform("web");

    expect(platform.isWeb).toBe(true);
    expect(platform.isNative).toBe(false);
    expect(platform.supportsBrowserNotifications).toBe(true);
    expect(platform.showsNotificationSettings).toBe(true);
    expect(platform.entryDatePickerMode).toBe("web-calendar");
  });

  it("resolves native-specific capabilities in one place", () => {
    const iosPlatform = createAppPlatform("ios");
    const androidPlatform = createAppPlatform("android");

    expect(iosPlatform.isIOS).toBe(true);
    expect(iosPlatform.entryDatePickerMode).toBe("native");
    expect(iosPlatform.supportsBrowserNotifications).toBe(false);

    expect(androidPlatform.isAndroid).toBe(true);
    expect(androidPlatform.usesAndroidDatePickerDialog).toBe(true);
  });
});
