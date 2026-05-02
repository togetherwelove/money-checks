export type AppPlatformOs = "android" | "ios" | (string & {});

export type AppPlatformConfig = {
  isAndroid: boolean;
  isIOS: boolean;
  os: AppPlatformOs;
  usesAndroidDatePickerDialog: boolean;
};

export function createAppPlatform(os: AppPlatformOs): AppPlatformConfig {
  const isAndroid = os === "android";
  const isIOS = os === "ios";

  return {
    isAndroid,
    isIOS,
    os,
    usesAndroidDatePickerDialog: isAndroid,
  };
}
