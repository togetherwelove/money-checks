import mobileAds from "react-native-google-mobile-ads";

let hasInitializedMobileAds = false;

export async function ensureMobileAdsInitialized(): Promise<void> {
  if (hasInitializedMobileAds) {
    return;
  }

  await mobileAds().initialize();
  hasInitializedMobileAds = true;
}
