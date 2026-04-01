import { useEffect, useState } from "react";
import { Platform } from "react-native";

import {
  type BrowserNotificationPermissionState,
  readBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  showBrowserNotification,
} from "../lib/notifications/browserNotifications";
import {
  getExpenseTotalForPeriod,
  shouldNotifyExpenseLimit,
} from "../notifications/application/expenseThresholds";
import {
  NotificationUiCopy,
  isRequiredNotificationEvent,
} from "../notifications/config/notificationCopy";
import { buildNotificationContent } from "../notifications/content/buildNotificationContent";
import { createExpenseLimitExceededEvent } from "../notifications/domain/notificationEventFactories";
import type {
  NotificationEvent,
  NotificationEventType,
  NotificationThresholdKey,
  NotificationThresholdPeriod,
} from "../notifications/domain/notificationEvents";
import type { NotificationPreferenceGroup } from "../notifications/preferences/notificationPreferences";
import type { LedgerEntry } from "../types/ledger";
import { upsertEntry } from "../utils/ledgerEntries";
import { useNotificationPreferences } from "./useNotificationPreferences";

type LedgerNotificationsState = {
  isSupported: boolean;
  notifyLedgerEvent: (event: NotificationEvent) => Promise<void>;
  notifySavedEntry: (savedEntry: LedgerEntry, currentEntries: LedgerEntry[]) => Promise<void>;
  permissionLabel: string;
  permissionState: BrowserNotificationPermissionState;
  preferenceGroups: NotificationPreferenceGroup[];
  requestNotifications: () => Promise<boolean>;
  showNotificationSettings: boolean;
  statusMessage: string;
  updatePreference: (eventType: NotificationEventType, enabled: boolean) => void;
  updateThresholdPeriod: (
    key: NotificationThresholdKey,
    period: NotificationThresholdPeriod,
  ) => void;
  updateThresholdValue: (key: NotificationThresholdKey, value: string) => void;
};

const NOTIFICATION_ASSETS = {
  badge: NotificationUiCopy.badgePath,
  icon: NotificationUiCopy.iconPath,
} as const;

export function useLedgerNotifications(userId: string): LedgerNotificationsState {
  const [permission, setPermission] = useState<BrowserNotificationPermissionState>(() =>
    Platform.OS === "web" ? readBrowserNotificationPermission() : "unsupported",
  );
  const {
    preferenceGroups,
    preferences,
    updateEventPreference,
    updateThresholdPeriod,
    updateThresholdValue,
  } = useNotificationPreferences(userId);

  useEffect(() => {
    if (Platform.OS !== "web") {
      return;
    }

    setPermission(readBrowserNotificationPermission());
  }, []);

  const isSupported = Platform.OS === "web" && permission !== "unsupported";

  const requestNotifications = async () => {
    const nextPermission = await requestBrowserNotificationPermission();
    setPermission(nextPermission);
    return nextPermission === "granted";
  };

  const notifyEvent = async (event: NotificationEvent) => {
    if (!isRequiredNotificationEvent(event.type) && !preferences.enabledByEvent[event.type]) {
      return;
    }

    await showBrowserNotification(buildNotificationContent(event), NOTIFICATION_ASSETS);
  };

  const notifySavedEntry = async (savedEntry: LedgerEntry, currentEntries: LedgerEntry[]) => {
    const nextEntries = upsertEntry(currentEntries, savedEntry);
    const nextEvents = [] as NotificationEvent[];

    if (savedEntry.type === "expense") {
      const { expenseAmount } = preferences.thresholds;
      const expensePeriod = preferences.thresholdPeriods.expenseAmount;
      if (
        shouldNotifyExpenseLimit({
          currentEntries,
          entryDate: savedEntry.date,
          nextEntries,
          period: expensePeriod,
          thresholdAmount: expenseAmount,
        })
      ) {
        nextEvents.push(
          createExpenseLimitExceededEvent(
            expensePeriod,
            getExpenseTotalForPeriod(nextEntries, savedEntry.date, expensePeriod),
            expenseAmount,
          ),
        );
      }
    }

    for (const event of nextEvents) {
      await notifyEvent(event);
    }
  };

  return {
    isSupported,
    notifyLedgerEvent: notifyEvent,
    notifySavedEntry,
    permissionLabel: getPermissionLabel(permission),
    permissionState: permission,
    preferenceGroups,
    requestNotifications,
    showNotificationSettings: Platform.OS === "web",
    statusMessage: getStatusMessage(permission),
    updatePreference: updateEventPreference,
    updateThresholdPeriod,
    updateThresholdValue,
  };
}

function getPermissionLabel(permission: BrowserNotificationPermissionState): string {
  if (permission === "granted") {
    return NotificationUiCopy.permissionGranted;
  }

  if (permission === "denied") {
    return NotificationUiCopy.permissionBlocked;
  }

  if (permission === "default") {
    return NotificationUiCopy.permissionPrompt;
  }

  return NotificationUiCopy.permissionUnsupported;
}

function getStatusMessage(permission: BrowserNotificationPermissionState): string {
  if (permission === "granted") {
    return NotificationUiCopy.enabledStatus;
  }

  if (permission === "denied") {
    return NotificationUiCopy.permissionBlocked;
  }

  if (permission === "default") {
    return NotificationUiCopy.defaultStatus;
  }

  return NotificationUiCopy.unsupportedStatus;
}
