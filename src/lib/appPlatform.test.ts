import { createAppPlatform } from "./appPlatformConfig";

describe("createAppPlatform", () => {
  it("resolves native-specific capabilities in one place", () => {
    const iosPlatform = createAppPlatform("ios");
    const androidPlatform = createAppPlatform("android");

    expect(iosPlatform.isIOS).toBe(true);

    expect(androidPlatform.isAndroid).toBe(true);
    expect(androidPlatform.usesAndroidDatePickerDialog).toBe(true);
  });
});
