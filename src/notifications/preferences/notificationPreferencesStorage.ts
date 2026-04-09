import { appStorage } from "../../lib/appStorage";
import {
  NotificationDefaultThresholdPeriods,
  NotificationDefaultThresholds,
  NotificationEventCopy,
  NotificationEventOrder,
  NotificationRequiredEvents,
} from "../config/notificationCopy";
import type { NotificationEventType } from "../domain/notificationEvents";
import type { NotificationPreferences } from "./notificationPreferences";

const STORAGE_KEY_PREFIX = "moneychecks.notification-preferences.v2";

export function loadNotificationPreferences(userId: string): NotificationPreferences {
  const fallbackPreferences = createDefaultNotificationPreferences();
  const rawValue = appStorage.getItem(createStorageKey(userId));
  if (!rawValue) {
    return fallbackPreferences;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Partial<NotificationPreferences>;
    const enabledByEvent = {
      ...fallbackPreferences.enabledByEvent,
      ...parsedValue.enabledByEvent,
    };
    for (const eventType of NotificationRequiredEvents) {
      enabledByEvent[eventType] = true;
    }

    return {
      enabledByEvent,
      thresholdPeriods: {
        ...fallbackPreferences.thresholdPeriods,
        ...parsedValue.thresholdPeriods,
      },
      thresholds: {
        ...fallbackPreferences.thresholds,
        ...parsedValue.thresholds,
      },
    };
  } catch {
    return fallbackPreferences;
  }
}

export function saveNotificationPreferences(
  userId: string,
  preferences: NotificationPreferences,
): void {
  appStorage.setItem(createStorageKey(userId), JSON.stringify(preferences));
}

function createDefaultNotificationPreferences(): NotificationPreferences {
  const enabledByEvent = {} as Record<NotificationEventType, boolean>;
  for (const eventType of NotificationEventOrder) {
    enabledByEvent[eventType] = NotificationEventCopy[eventType].defaultEnabled;
  }

  return {
    enabledByEvent,
    thresholdPeriods: {
      ...NotificationDefaultThresholdPeriods,
    },
    thresholds: {
      ...NotificationDefaultThresholds,
    },
  };
}

function createStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}.${userId}`;
}
