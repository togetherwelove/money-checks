import { readFileSync } from "node:fs";
import path from "node:path";

import type { ExpoConfig } from "expo/config";

const packageJsonPath = path.join(__dirname, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { version?: string };
const appVersion = packageJson.version ?? "0.0.0";
const admobAndroidAppId = process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ?? "";
const admobIosAppId = process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID ?? "";
const appIconPath = "./asset/icon.png";
const androidAdaptiveForegroundPath = "./asset/adaptive-icon-foreground.png";
const imagePickerPermissionConfig = {
  cameraPermission:
    "알뜰 앱 이용 중 첨부할 이미지를 촬영하기 위해 카메라 접근 권한이 필요합니다.",
  microphonePermission: false,
  photosPermission:
    "알뜰 앱 이용 중 첨부할 이미지를 선택하기 위해 사진 보관함 접근 권한이 필요합니다.",
} as const;

const config: ExpoConfig = {
  name: "알뜰",
  slug: "money-checks",
  scheme: "moneychecks",
  version: appVersion,
  icon: appIconPath,
  orientation: "portrait",
  userInterfaceStyle: "light",
  extra: {
    eas: {
      projectId: "36c2b019-99be-4045-b4ce-ed1a031c4aa8",
    },
  },
  splash: {
    resizeMode: "contain",
    backgroundColor: "#f5f1e8",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    bundleIdentifier: "com.chanwook.moneychecks",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
    supportsTablet: false,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: androidAdaptiveForegroundPath,
      backgroundColor: "#f5f1e8",
    },
    package: "com.chanwook.moneychecks",
  },
  plugins: [
    "@react-native-community/datetimepicker",
    "expo-sqlite",
    "expo-font",
    "expo-secure-store",
    "expo-apple-authentication",
    ["expo-image-picker", imagePickerPermissionConfig],
    "expo-notifications",
    [
      "react-native-google-mobile-ads",
      {
        androidAppId: admobAndroidAppId,
        iosAppId: admobIosAppId,
      },
    ],
  ],
};

export default config;
