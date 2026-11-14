import { readFileSync } from "node:fs";
import path from "node:path";

import type { ExpoConfig } from "expo/config";

import appBrand from "./app-brand.json";
import easProject from "./eas-project.json";

const admobAppIdPattern = /^ca-app-pub-\d+~\d+$/;
const androidAdMobTestAppId = "ca-app-pub-3940256099942544~3347511713";
const isDevelopmentVariant = process.env.APP_VARIANT === "development";
const appScheme = isDevelopmentVariant ? "moneychecks-dev" : "moneychecks";
const appName = isDevelopmentVariant ? "알뜰 (개발)" : "알뜰";

function readRequiredAdMobAppId(environmentVariableName: string, fallbackAppId?: string) {
  const appId = process.env[environmentVariableName]?.trim() ?? fallbackAppId;
  if (!appId || !admobAppIdPattern.test(appId)) {
    throw new Error(
      `${environmentVariableName} must be a valid AdMob app ID in ca-app-pub-<publisher>~<app> format.`,
    );
  }

  return appId;
}

const packageJsonPath = path.join(__dirname, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { version?: string };
const easConfigPath = path.join(__dirname, "eas.json");
const easConfig = JSON.parse(readFileSync(easConfigPath, "utf8")) as {
  build: { base: { env: Record<string, string> } };
};
const appVersion = packageJson.version ?? "0.0.0";
const admobIosAppId = readRequiredAdMobAppId(
  "EXPO_PUBLIC_ADMOB_IOS_APP_ID",
  easConfig.build.base.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID,
);
const admobAndroidAppId = readRequiredAdMobAppId(
  "EXPO_PUBLIC_ADMOB_ANDROID_APP_ID",
  androidAdMobTestAppId,
);
const nativeAdDebuggerEnable = false;
const appIconPath = isDevelopmentVariant
  ? "./assets/app/icon.development.png"
  : "./assets/app/icon.png";
const splashLogoPath = "./assets/app/splash-logo.png";
const splashScreenConfig = {
  dark: { image: splashLogoPath, backgroundColor: appBrand.darkScreenBackground },
  image: splashLogoPath,
  resizeMode: "contain" as const,
  backgroundColor: isDevelopmentVariant
    ? appBrand.developmentAppIconBackground
    : appBrand.appIconBackground,
};
const iosGoogleServicesFilePath = resolveIosGoogleServicesFilePath(isDevelopmentVariant);
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

function resolveIosGoogleServicesFilePath(isDevelopment: boolean) {
  const googleServicesEnvironmentVariable = isDevelopment
    ? "GOOGLE_SERVICE_INFO_PLIST_DEV"
    : "GOOGLE_SERVICE_INFO_PLIST";
  return process.env[googleServicesEnvironmentVariable]?.trim() || undefined;
}

const config: ExpoConfig = {
  name: appName,
  slug: "money-checks",
  scheme: appScheme,
  version: appVersion,
  icon: appIconPath,
  orientation: "default",
  userInterfaceStyle: "automatic",
  extra: {
    eas: {
      projectId: easProject.projectId,
    },
  },
  ios: {
    bundleIdentifier: isDevelopmentVariant
      ? "com.chanwook.moneychecks.dev"
      : "com.chanwook.moneychecks",
    googleServicesFile: iosGoogleServicesFilePath,
    infoPlist: {
      CFBundleDevelopmentRegion: iosDevelopmentRegion,
      CFBundleLocalizations: iosBundleLocalizations,
      GADNativeAdValidatorEnabled: nativeAdDebuggerEnable,
      ITSAppUsesNonExemptEncryption: false,
      NSUserTrackingUsageDescription: iosUserTrackingPermission,
    },
    supportsTablet: true,
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
        androidAppId: admobAndroidAppId,
        iosAppId: admobIosAppId,
      },
    ],
  ],
};

export default config;
