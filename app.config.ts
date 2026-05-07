import { readFileSync } from "node:fs";
import path from "node:path";

import type { ExpoConfig } from "expo/config";

const packageJsonPath = path.join(__dirname, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { version?: string };
const appVersion = packageJson.version ?? "0.0.0";
const admobAndroidAppId = process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ?? "";
const admobIosAppId = process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID ?? "";
const appIconPath = "./assets/app/icon.png";
const androidAdaptiveForegroundPath = "./assets/app/adaptive-icon-foreground.png";
const androidGoogleServicesFilePath = "./android/app/google-services.json";
const iosGoogleServicesFilePath = "./GoogleService-Info.plist";
const androidPostNotificationsPermission = "android.permission.POST_NOTIFICATIONS";
const iosUserTrackingPermission =
  "맞춤형 광고를 제공하고 광고 성과를 측정하기 위해 앱 추적 권한을 사용합니다.";
const imagePickerPermissionConfig = {
  cameraPermission: "알뜰 앱 이용 중 첨부할 이미지를 촬영하기 위해 카메라 접근 권한이 필요합니다.",
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
    googleServicesFile: iosGoogleServicesFilePath,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSUserTrackingUsageDescription: iosUserTrackingPermission,
    },
    supportsTablet: false,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: androidAdaptiveForegroundPath,
      backgroundColor: "#f5f1e8",
    },
    googleServicesFile: androidGoogleServicesFilePath,
    package: "com.chanwook.moneychecks",
    permissions: [androidPostNotificationsPermission],
  },
  plugins: [
    "@react-native-community/datetimepicker",
    "expo-sqlite",
    "expo-font",
    "expo-secure-store",
    "expo-apple-authentication",
    "expo-mail-composer",
    "expo-sharing",
    [
      "expo-tracking-transparency",
      {
        userTrackingPermission: iosUserTrackingPermission,
      },
    ],
    ["expo-image-picker", imagePickerPermissionConfig],
    [
      "expo-notifications",
      {
        enableBackgroundRemoteNotifications: true,
      },
    ],
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
