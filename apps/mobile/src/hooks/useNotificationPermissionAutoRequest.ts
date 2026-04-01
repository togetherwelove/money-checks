import { useCallback, useEffect, useState } from "react";

import { appStorage } from "../lib/appStorage";
import type { BrowserNotificationPermissionState } from "../lib/notifications/browserNotifications";

const STORAGE_KEY_PREFIX = "moneychecks.notification-permission-auto-request.v1";

type NotificationPermissionAutoRequestState = {
  completeAutoRequest: () => void;
  shouldAutoRequest: boolean;
};

export function useNotificationPermissionAutoRequest(
  userId: string,
  permissionState: BrowserNotificationPermissionState,
  isSupported: boolean,
): NotificationPermissionAutoRequestState {
  const [hasCompletedAutoRequest, setHasCompletedAutoRequest] = useState(() =>
    readAutoRequestState(userId),
  );

  useEffect(() => {
    setHasCompletedAutoRequest(readAutoRequestState(userId));
  }, [userId]);

  const completeAutoRequest = useCallback(() => {
    appStorage.setItem(createStorageKey(userId), "true");
    setHasCompletedAutoRequest(true);
  }, [userId]);

  return {
    completeAutoRequest,
    shouldAutoRequest: isSupported && permissionState === "default" && !hasCompletedAutoRequest,
  };
}

function readAutoRequestState(userId: string): boolean {
  return appStorage.getItem(createStorageKey(userId)) === "true";
}

function createStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}.${userId}`;
}
