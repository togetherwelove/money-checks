import { RevenueCatConfig } from "../../constants/subscription";
import { appPlatform } from "../appPlatform";

export function getRevenueCatPublicApiKey(): string {
  if (appPlatform.isAndroid) {
    return RevenueCatConfig.androidPublicApiKey || RevenueCatConfig.publicApiKey;
  }

  if (appPlatform.isIOS) {
    return RevenueCatConfig.iosPublicApiKey || RevenueCatConfig.publicApiKey;
  }

  return RevenueCatConfig.publicApiKey;
}
