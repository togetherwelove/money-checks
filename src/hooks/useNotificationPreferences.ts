import { useEffect, useMemo, useState } from "react";

import {
  NotificationDefaultThresholdEnabled,
  NotificationEventCopy,
  NotificationEventOrder,
  NotificationGroupCopy,
  NotificationGroupOrder,
  NotificationThresholdCopy,
  NotificationThresholdFieldLabels,
  isRequiredNotificationEvent,
} from "../notifications/config/notificationCopy";
import type {
  NotificationEventType,
  NotificationThresholdKey,
} from "../notifications/domain/notificationEvents";
import type {
  NotificationPreferenceGroup,
  NotificationPreferences,
} from "../notifications/preferences/notificationPreferences";
import {
  createDefaultNotificationPreferences,
  loadNotificationPreferences,
  saveNotificationPreferences,
} from "../notifications/preferences/notificationPreferencesStorage";
import { sanitizeAmountInput } from "../utils/ledgerEntries";

type NotificationPreferencesState = {
  preferenceGroups: NotificationPreferenceGroup[];
  preferences: NotificationPreferences;
  updateEventPreference: (eventType: NotificationEventType, enabled: boolean) => void;
  updateThresholdEnabled: (key: NotificationThresholdKey, enabled: boolean) => void;
  updateThresholdValue: (key: NotificationThresholdKey, value: string) => void;
};

export function useNotificationPreferences(userId: string): NotificationPreferencesState {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    createDefaultNotificationPreferences,
  );

  useEffect(() => {
    let isMounted = true;

    void loadNotificationPreferences(userId)
      .then((nextPreferences) => {
        if (isMounted) {
          setPreferences(nextPreferences);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPreferences(createDefaultNotificationPreferences());
        }
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const preferenceGroups = useMemo(() => buildPreferenceGroups(preferences), [preferences]);
  return {
    preferenceGroups,
    preferences,
    updateEventPreference: (eventType, enabled) => {
      if (isRequiredNotificationEvent(eventType)) {
        return;
      }

      setPreferences((currentPreferences) => {
        const nextPreferences = {
          ...currentPreferences,
          enabledByEvent: {
            ...currentPreferences.enabledByEvent,
            [eventType]: enabled,
          },
        };
        void saveNotificationPreferences(userId, nextPreferences);
        return nextPreferences;
      });
    },
    updateThresholdEnabled: (key, enabled) => {
      setPreferences((currentPreferences) => {
        const nextPreferences = {
          ...currentPreferences,
          enabledThresholds: {
            ...currentPreferences.enabledThresholds,
            [key]: enabled,
          },
        };
        void saveNotificationPreferences(userId, nextPreferences);
        return nextPreferences;
      });
    },
    updateThresholdValue: (key, value) => {
      const sanitizedValue = sanitizeAmountInput(value);
      const nextThreshold = sanitizedValue ? Number(sanitizedValue) : 0;

      setPreferences((currentPreferences) => {
        const nextPreferences = {
          ...currentPreferences,
          thresholds: {
            ...currentPreferences.thresholds,
            [key]: nextThreshold,
          },
        };
        void saveNotificationPreferences(userId, nextPreferences);
        return nextPreferences;
      });
    },
  };
}

function buildPreferenceGroups(
  preferences: NotificationPreferences,
): NotificationPreferenceGroup[] {
  const thresholdFields = Object.entries(NotificationThresholdCopy).map(([key, fieldCopy]) => ({
    description: fieldCopy.description,
    enabled:
      preferences.enabledThresholds[key as NotificationThresholdKey] ??
      NotificationDefaultThresholdEnabled[key as NotificationThresholdKey],
    key: key as NotificationThresholdKey,
    label: NotificationThresholdFieldLabels[key as NotificationThresholdKey],
    value: formatThresholdValue(preferences.thresholds[key as NotificationThresholdKey]),
  })) as NotificationPreferenceGroup["thresholdFields"];

  return NotificationGroupOrder.map((groupId) => ({
    description: NotificationGroupCopy[groupId].description,
    id: groupId,
    items:
      groupId === "threshold"
        ? []
        : NotificationEventOrder.filter(
            (eventType) =>
              NotificationEventCopy[eventType].groupId === groupId &&
              !isRequiredNotificationEvent(eventType),
          ).map((eventType) => ({
            description: NotificationEventCopy[eventType].description,
            enabled: preferences.enabledByEvent[eventType],
            label: NotificationEventCopy[eventType].label,
            type: eventType,
          })),
    thresholdFields: groupId === "threshold" ? thresholdFields : undefined,
    title: NotificationGroupCopy[groupId].title,
  })) as NotificationPreferenceGroup[];
}

function formatThresholdValue(value: number): string {
  return value > 0 ? String(value) : "";
}
