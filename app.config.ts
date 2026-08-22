import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { loadProjectEnv } from "@expo/env";
import type { ExpoConfig } from "expo/config";

import appBrand from "./app-brand.json";
import easProject from "./eas-project.json";

loadProjectEnv(__dirname, { silent: true });

const admobAppIdPattern = /^ca-app-pub-\d+~\d+$/;

function readRequiredAdMobAppId(environmentVariableName: string) {
  const appId = process.env[environmentVariableName]?.trim();
  if (!appId || !admobAppIdPattern.test(appId)) {
    throw new Error(
      `${environmentVariableName} must be a valid AdMob app ID in ca-app-pub-<publisher>~<app> format.`,
    );
  }

  return appId;
}

const packageJsonPath = path.join(__dirname, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { version?: string };
const appVersion = packageJson.version ?? "0.0.0";
const admobIosAppId = readRequiredAdMobAppId("EXPO_PUBLIC_ADMOB_IOS_APP_ID");
const nativeAdDebuggerEnable = false;
const appIconPath = "./assets/app/icon.png";
const splashScreenConfig = {
  image: appIconPath,
  resizeMode: "contain" as const,
  backgroundColor: appBrand.appIconBackground,
};
const iosGoogleServicesFilePath = resolveIosGoogleServicesFilePath();
const iosDevelopmentRegion = "ko";
const iosBundleLocalizations = ["ko"] as const;
const iosUserTrackingPermission =
  "맞춤형 광고를 제공하고 광고 성과를 측정하기 위해 앱 추적 권한을 사용합니다.";
const imagePickerPermissionConfig = {
  cameraPermission: "알뜰 앱 이용 중 첨부할 이미지를 촬영하기 위해 카메라 접근 권한이 필요합니다.",
  microphonePermission: false,
  photosPermission:
    "알뜰 앱 이용 중 첨부할 이미지를 선택하기 위해 사진 보관함 접근 권한이 필요합니다.",
} as const;

function resolveIosGoogleServicesFilePath() {
  const localGoogleServicesFilePath = "./GoogleService-Info.plist";
  if (existsSync(path.join(__dirname, localGoogleServicesFilePath))) {
    return localGoogleServicesFilePath;
  }

  const googleServicesInfoPlist = process.env.GOOGLE_SERVICE_INFO_PLIST;
  if (!googleServicesInfoPlist) {
    return localGoogleServicesFilePath;
  }

  const generatedGoogleServicesFilePath = "./.eas-build-state/GoogleService-Info.plist";
  const absoluteGeneratedGoogleServicesFilePath = path.join(
    __dirname,
    generatedGoogleServicesFilePath,
  );
  mkdirSync(path.dirname(absoluteGeneratedGoogleServicesFilePath), { recursive: true });
  writeFileSync(absoluteGeneratedGoogleServicesFilePath, googleServicesInfoPlist, "utf8");
  return generatedGoogleServicesFilePath;
}

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
      projectId: easProject.projectId,
    },
  },
  splash: splashScreenConfig,
  assetBundlePatterns: ["**/*"],
  ios: {
    bundleIdentifier: "com.chanwook.moneychecks",
    googleServicesFile: iosGoogleServicesFilePath,
    infoPlist: {
      CFBundleDevelopmentRegion: iosDevelopmentRegion,
      CFBundleLocalizations: iosBundleLocalizations,
      GADNativeAdValidatorEnabled: nativeAdDebuggerEnable,
      ITSAppUsesNonExemptEncryption: false,
      NSUserTrackingUsageDescription: iosUserTrackingPermission,
    },
    supportsTablet: false,
  },
  plugins: [
    "@react-native-community/datetimepicker",
    "expo-sqlite",
    "expo-font",
    "expo-secure-store",
    ["expo-splash-screen", splashScreenConfig],
    "expo-apple-authentication",
    "expo-web-browser",
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
        iosAppId: admobIosAppId,
      },
    ],
  ],
};

export default config;
