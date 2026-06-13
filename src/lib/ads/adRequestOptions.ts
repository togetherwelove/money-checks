import type { RequestOptions } from "react-native-google-mobile-ads";

import type { AdTrackingPermissionState } from "./trackingTransparency";

let shouldRequestNonPersonalizedAdsOnly = false;

export function applyAdTrackingPermissionToAdRequests(
  trackingPermissionState: AdTrackingPermissionState,
): void {
  shouldRequestNonPersonalizedAdsOnly =
    trackingPermissionState === "denied" || trackingPermissionState === "not-determined";
}

export function getAdRequestOptions(): RequestOptions {
  return shouldRequestNonPersonalizedAdsOnly ? { requestNonPersonalizedAdsOnly: true } : {};
}
