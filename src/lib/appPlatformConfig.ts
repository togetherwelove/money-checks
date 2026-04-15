export type AppPlatformOs = "android" | "ios" | "web" | (string & {});
export type EntryDatePickerMode = "native" | "web-calendar";

export type AppPlatformConfig = {
  entryDatePickerMode: EntryDatePickerMode;
  isAndroid: boolean;
  isIOS: boolean;
  isNative: boolean;
  isWeb: boolean;
  os: AppPlatformOs;
  showsNotificationSettings: boolean;
  supportsPushNotifications: boolean;
  usesAndroidDatePickerDialog: boolean;
};

export function createAppPlatform(os: AppPlatformOs): AppPlatformConfig {
  const isWeb = os === "web";
  const isAndroid = os === "android";
  const isIOS = os === "ios";

  return {
    entryDatePickerMode: isWeb ? "web-calendar" : "native",
    isAndroid,
    isIOS,
    isNative: !isWeb,
    isWeb,
    os,
    showsNotificationSettings: !isWeb,
    supportsPushNotifications: !isWeb,
    usesAndroidDatePickerDialog: isAndroid,
  };
}
