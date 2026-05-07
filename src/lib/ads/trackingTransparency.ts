import {
  type PermissionResponse,
  PermissionStatus,
  getTrackingPermissionsAsync,
  isAvailable,
  requestTrackingPermissionsAsync,
} from "expo-tracking-transparency";
import { Linking } from "react-native";

import { appPlatform } from "../appPlatform";

export type AdTrackingPermissionState = "authorized" | "denied" | "not-determined" | "unavailable";

export function isAdTrackingPermissionSupported(): boolean {
  return appPlatform.isIOS && isAvailable();
}

export async function readAdTrackingPermissionState(): Promise<AdTrackingPermissionState> {
  if (!isAdTrackingPermissionSupported()) {
    return "unavailable";
  }

  return mapTrackingPermissionResponse(await getTrackingPermissionsAsync());
}

export async function requestAdTrackingPermission(): Promise<AdTrackingPermissionState> {
  if (!isAdTrackingPermissionSupported()) {
    return "unavailable";
  }

  return mapTrackingPermissionResponse(await requestTrackingPermissionsAsync());
}

export async function requestAdTrackingPermissionIfNeeded(): Promise<AdTrackingPermissionState> {
  const currentState = await readAdTrackingPermissionState();
  if (currentState !== "not-determined") {
    return currentState;
  }

  return requestAdTrackingPermission();
}

export async function openAdTrackingSettings(): Promise<void> {
  await Linking.openSettings();
}

function mapTrackingPermissionResponse(
  permissionResponse: PermissionResponse,
): AdTrackingPermissionState {
  if (permissionResponse.granted || permissionResponse.status === PermissionStatus.GRANTED) {
    return "authorized";
  }

  if (permissionResponse.status === PermissionStatus.UNDETERMINED) {
    return "not-determined";
  }

  return "denied";
}
