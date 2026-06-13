import { RevenueCatConfig } from "../../constants/subscription";

export function getRevenueCatPublicApiKey(): string {
  return RevenueCatConfig.iosPublicApiKey || RevenueCatConfig.publicApiKey;
}
