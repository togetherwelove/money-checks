import { Platform } from "react-native";

type PlatformAdUnitIds = {
  androidAdUnitId: string;
  iosAdUnitId: string;
};

export function resolveAdMobAdUnitId(
  configuredAdUnitIds: PlatformAdUnitIds,
  testAdUnitId: string,
): string {
  if (__DEV__) {
    return testAdUnitId;
  }

  if (Platform.OS === "android") {
    return configuredAdUnitIds.androidAdUnitId;
  }

  if (Platform.OS === "ios") {
    return configuredAdUnitIds.iosAdUnitId;
  }

  return "";
}
