import { syncNotificationSummaryTimeZone } from "../../notifications/preferences/notificationPreferencesStorage";
import { appStorage } from "../appStorage";
import { supabase } from "../supabase";

const PUSH_DEVICE_TOKEN_STORAGE_KEY = "moneychecks.push-device-token.current";
const SYNC_PUSH_DEVICE_TOKEN_FUNCTION = "sync_push_device_token";
const PUSH_DEVICE_TOKENS_TABLE = "push_device_tokens";

export async function syncPushDeviceToken(
  expoPushToken: string,
  platform: "android" | "ios",
  userId: string,
): Promise<void> {
  const previousPushToken = readStoredPushDeviceToken();

  const { error } = await supabase.rpc(SYNC_PUSH_DEVICE_TOKEN_FUNCTION, {
    next_expo_push_token: expoPushToken,
    next_platform: platform,
    previous_expo_push_token: previousPushToken,
  });

  if (error) {
    throw error;
  }

  await syncNotificationSummaryTimeZone(userId);
  appStorage.setItem(PUSH_DEVICE_TOKEN_STORAGE_KEY, expoPushToken);
}

export async function removeStoredPushDeviceToken(userId: string): Promise<void> {
  const expoPushToken = readStoredPushDeviceToken();
  if (!expoPushToken) {
    return;
  }

  const { error } = await supabase
    .from(PUSH_DEVICE_TOKENS_TABLE)
    .delete()
    .eq("expo_push_token", expoPushToken)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  appStorage.removeItem(PUSH_DEVICE_TOKEN_STORAGE_KEY);
}

export function clearStoredPushDeviceToken(): void {
  appStorage.removeItem(PUSH_DEVICE_TOKEN_STORAGE_KEY);
}

function readStoredPushDeviceToken(): string | null {
  const storedValue = appStorage.getItem(PUSH_DEVICE_TOKEN_STORAGE_KEY);
  return storedValue?.trim() ? storedValue : null;
}
