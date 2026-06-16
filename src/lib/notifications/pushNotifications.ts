import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

import { buildNotificationActionCategoryDefinitions } from "./notificationActions";
import { syncPushDeviceToken } from "./pushDeviceTokens";

export type NotificationPermissionState = "default" | "denied" | "granted" | "unsupported";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function isPushNotificationSupported(): boolean {
  return Device.isDevice;
}

export async function readPushNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isPushNotificationSupported()) {
    return "unsupported";
  }

  const settings = await Notifications.getPermissionsAsync();
  return mapExpoPermissionStatus(settings.status);
}

export async function requestPushNotificationPermission(
  userId: string,
): Promise<NotificationPermissionState> {
  if (!isPushNotificationSupported()) {
    return "unsupported";
  }

  const settings = await Notifications.requestPermissionsAsync();
  const permissionState = mapExpoPermissionStatus(settings.status);

  if (permissionState === "granted") {
    await syncPushRegistration(userId);
  }

  return permissionState;
}

export async function syncPushRegistration(userId: string): Promise<void> {
  if (!isPushNotificationSupported()) {
    return;
  }

  const permissionState = await readPushNotificationPermission();
  if (permissionState !== "granted") {
    return;
  }

  const projectId = resolveExpoProjectId();
  if (!projectId) {
    throw new Error("Expo project ID is required for push notifications.");
  }

  const expoPushToken = (
    await Notifications.getExpoPushTokenAsync({
      projectId,
    })
  ).data;

  await syncPushDeviceToken(expoPushToken, "ios", userId);
}

export async function registerNotificationActionCategories(): Promise<void> {
  await Promise.all(
    buildNotificationActionCategoryDefinitions().map((category) =>
      Notifications.setNotificationCategoryAsync(category.identifier, [...category.actions]),
    ),
  );
}

function mapExpoPermissionStatus(
  status: Notifications.PermissionStatus,
): NotificationPermissionState {
  if (status === "granted") {
    return "granted";
  }

  if (status === "denied") {
    return "denied";
  }

  return "default";
}

function resolveExpoProjectId(): string | null {
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;

  return typeof projectId === "string" && projectId.trim() ? projectId : null;
}
