import { useEffect, useState } from "react";

import { appPlatform } from "../lib/appPlatform";
import { logAppError } from "../lib/logAppError";
import {
  sendPendingJoinRequestNotification,
  sendPushNotificationToBookMembers,
  sendPushNotificationToUsers,
} from "../lib/notifications/pushNotificationDispatch";
import {
  type NotificationPermissionState,
  readPushNotificationPermission,
  requestPushNotificationPermission,
  syncPushRegistration,
} from "../lib/notifications/pushNotifications";
import {
  getExpenseTotalForPeriod,
  shouldNotifyExpenseLimit,
} from "../notifications/application/expenseThresholds";
import { NotificationDefaultThresholdPeriods } from "../notifications/config/notificationCopy";
import { PushNotificationCopy } from "../notifications/config/pushNotificationCopy";
import { createExpenseLimitExceededEvent } from "../notifications/domain/notificationEventFactories";
import type {
  NotificationEvent,
  NotificationEventType,
  NotificationThresholdKey,
} from "../notifications/domain/notificationEvents";
import type { NotificationPreferenceGroup } from "../notifications/preferences/notificationPreferences";
import type { LedgerEntry } from "../types/ledger";
import { upsertEntry } from "../utils/ledgerEntries";
import { useNotificationPreferences } from "./useNotificationPreferences";

type LedgerNotificationsState = {
  isSupported: boolean;
  notifySavedEntry: (savedEntry: LedgerEntry, currentEntries: LedgerEntry[]) => Promise<void>;
  permissionLabel: string;
  permissionState: NotificationPermissionState;
  preferenceGroups: NotificationPreferenceGroup[];
  requestNotifications: () => Promise<boolean>;
  sendPendingJoinRequestNotification: (requesterName: string) => Promise<void>;
  sendPushNotificationToBookMembers: (
    bookId: string,
    event: NotificationEvent,
    excludeUserIds: string[],
  ) => Promise<void>;
  sendPushNotificationToUsers: (
    event: NotificationEvent,
    targetUserIds: string[],
    bookId?: string,
  ) => Promise<void>;
  showNotificationSettings: boolean;
  statusMessage: string;
  updatePreference: (eventType: NotificationEventType, enabled: boolean) => void;
  updateThresholdEnabled: (key: NotificationThresholdKey, enabled: boolean) => void;
  updateThresholdValue: (key: NotificationThresholdKey, value: string) => void;
};

export function useLedgerNotifications(userId: string): LedgerNotificationsState {
  const [permission, setPermission] = useState<NotificationPermissionState>(
    appPlatform.supportsPushNotifications ? "default" : "unsupported",
  );
  const {
    preferenceGroups,
    preferences,
    updateEventPreference,
    updateThresholdEnabled,
    updateThresholdValue,
  } = useNotificationPreferences(userId);

  useEffect(() => {
    let isMounted = true;

    void readPushNotificationPermission()
      .then((nextPermission) => {
        if (isMounted) {
          setPermission(nextPermission);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPermission("unsupported");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (permission !== "granted") {
      return;
    }

    void syncPushRegistration(userId).catch((error) => {
      logAppError("LedgerNotifications", error, {
        step: "sync_push_registration",
        userId,
      });
    });
  }, [permission, userId]);

  const isSupported = appPlatform.supportsPushNotifications && permission !== "unsupported";

  const requestNotifications = async () => {
    try {
      const nextPermission = await requestPushNotificationPermission(userId);
      setPermission(nextPermission);
      return nextPermission === "granted";
    } catch (error) {
      logAppError("LedgerNotifications", error, {
        step: "request_push_notification_permission",
        userId,
      });
      setPermission("granted");
      return true;
    }
  };

  const notifySavedEntry = async (savedEntry: LedgerEntry, currentEntries: LedgerEntry[]) => {
    const nextEntries = upsertEntry(currentEntries, savedEntry);

    if (savedEntry.type !== "expense") {
      return;
    }

    for (const thresholdKey of Object.keys(preferences.thresholds) as NotificationThresholdKey[]) {
      const thresholdAmount = preferences.thresholds[thresholdKey];
      const thresholdPeriod = NotificationDefaultThresholdPeriods[thresholdKey];

      if (!preferences.enabledThresholds[thresholdKey]) {
        continue;
      }

      if (
        !shouldNotifyExpenseLimit({
          currentEntries,
          entryDate: savedEntry.date,
          nextEntries,
          period: thresholdPeriod,
          thresholdAmount,
        })
      ) {
        continue;
      }

      await sendPushNotificationToUsersInternal(
        createExpenseLimitExceededEvent(
          thresholdPeriod,
          getExpenseTotalForPeriod(nextEntries, savedEntry.date, thresholdPeriod),
          thresholdAmount,
        ),
        [userId],
      );
    }
  };

  const sendPushNotificationToBookMembersInternal = async (
    bookId: string,
    event: NotificationEvent,
    excludeUserIds: string[],
  ) => {
    try {
      await sendPushNotificationToBookMembers(bookId, event, excludeUserIds);
    } catch (error) {
      logAppError("LedgerNotifications", error, {
        bookId,
        eventType: event.type,
        step: "send_push_notification_to_book_members",
      });
    }
  };

  const sendPushNotificationToUsersInternal = async (
    event: NotificationEvent,
    targetUserIds: string[],
    bookId?: string,
  ) => {
    try {
      await sendPushNotificationToUsers(event, targetUserIds, bookId);
    } catch (error) {
      logAppError("LedgerNotifications", error, {
        bookId: bookId ?? null,
        eventType: event.type,
        step: "send_push_notification_to_users",
        targetUserIds,
      });
    }
  };

  const sendPendingJoinRequestNotificationInternal = async (requesterName: string) => {
    try {
      await sendPendingJoinRequestNotification(requesterName);
    } catch (error) {
      logAppError("LedgerNotifications", error, {
        requesterName,
        step: "send_pending_join_request_notification",
      });
    }
  };

  return {
    isSupported,
    notifySavedEntry,
    permissionLabel: getPermissionLabel(permission),
    permissionState: permission,
    preferenceGroups,
    requestNotifications,
    sendPendingJoinRequestNotification: sendPendingJoinRequestNotificationInternal,
    sendPushNotificationToBookMembers: sendPushNotificationToBookMembersInternal,
    sendPushNotificationToUsers: sendPushNotificationToUsersInternal,
    showNotificationSettings: appPlatform.showsNotificationSettings && permission !== "unsupported",
    statusMessage: getStatusMessage(permission),
    updatePreference: updateEventPreference,
    updateThresholdEnabled,
    updateThresholdValue,
  };
}

function getPermissionLabel(permission: NotificationPermissionState): string {
  if (permission === "granted") {
    return PushNotificationCopy.permissionGranted;
  }

  if (permission === "denied") {
    return PushNotificationCopy.permissionBlocked;
  }

  if (permission === "default") {
    return PushNotificationCopy.permissionPrompt;
  }

  return PushNotificationCopy.permissionUnsupported;
}

function getStatusMessage(permission: NotificationPermissionState): string {
  if (permission === "granted") {
    return PushNotificationCopy.statusEnabled;
  }

  if (permission === "denied") {
    return PushNotificationCopy.permissionBlocked;
  }

  if (permission === "default") {
    return PushNotificationCopy.statusDefault;
  }

  return PushNotificationCopy.statusUnsupported;
}
