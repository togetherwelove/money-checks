import { RevenueCatConfig, RevenueCatConfigurationErrors } from "../../constants/subscription";

export function getRevenueCatPublicApiKey(): string {
  if (RevenueCatConfig.useTestStore) {
    const testKey = RevenueCatConfig.testPublicApiKey.trim();
    if (testKey && !testKey.startsWith(RevenueCatConfig.testKeyPrefix)) {
      throw new Error(RevenueCatConfigurationErrors.invalidTestKey);
    }
    return testKey;
  }

  const storeKey = (RevenueCatConfig.iosPublicApiKey || RevenueCatConfig.publicApiKey).trim();
  if (storeKey.startsWith(RevenueCatConfig.testKeyPrefix)) {
    throw new Error(RevenueCatConfigurationErrors.testKeyInProduction);
  }
  return storeKey;
}
