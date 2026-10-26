import * as SecureStore from "expo-secure-store";
import { AppState } from "react-native";

import { AuthStorageConfig } from "../constants/authStorage";

let foregroundWait: Promise<void> | null = null;

function waitForForeground(): Promise<void> {
  if (AppState.currentState === "active") return Promise.resolve();
  if (foregroundWait) return foregroundWait;
  foregroundWait = new Promise(resolve => {
    const subscription = AppState.addEventListener("change", state => {
      if (state !== "active") return;
      subscription.remove();
      foregroundWait = null;
      resolve();
    });
  });
  return foregroundWait;
}

async function withForegroundAccess<T>(operation: () => Promise<T>): Promise<T> {
  let retries = 0;
  for (;;) {
    await waitForForeground();
    if (AppState.currentState !== "active") continue;
    try {
      return await operation();
    } catch (error) {
      const message = error && typeof error === "object" && "message" in error ? String(error.message) : String(error);
      if (!message.includes(AuthStorageConfig.interactionNotAllowedMessage)) throw error;
      if (AppState.currentState !== "active") continue;
      if (retries >= AuthStorageConfig.accessRetryLimit) throw error;
      retries++;
      await new Promise(resolve => setTimeout(resolve, AuthStorageConfig.accessRetryDelayMs));
    }
  }
}

export const foregroundSecureStore = {
  getItemAsync: (key: string) => withForegroundAccess(() => SecureStore.getItemAsync(key)),
  setItemAsync: (key: string, value: string) => withForegroundAccess(() => SecureStore.setItemAsync(key, value)),
  deleteItemAsync: (key: string) => withForegroundAccess(() => SecureStore.deleteItemAsync(key)),
};
