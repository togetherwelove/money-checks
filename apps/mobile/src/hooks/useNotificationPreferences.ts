import { useEffect, useMemo, useState } from "react";

import {
  NotificationDefaultThresholdPeriods,
  NotificationEventCopy,
  NotificationEventOrder,
  NotificationGroupCopy,
  NotificationGroupOrder,
  NotificationThresholdCopy,
  NotificationThresholdPeriodCopy,
  NotificationThresholdPeriodOrder,
  NotificationUiCopy,
  isRequiredNotificationEvent,
} from "../notifications/config/notificationCopy";
import type {
  NotificationEventType,
  NotificationThresholdKey,
  NotificationThresholdPeriod,
} from "../notifications/domain/notificationEvents";
import type {
  NotificationPreferenceGroup,
  NotificationPreferences,
} from "../notifications/preferences/notificationPreferences";
import {
  loadNotificationPreferences,
  saveNotificationPreferences,
} from "../notifications/preferences/notificationPreferencesStorage";
import { sanitizeAmountInput } from "../utils/ledgerEntries";

type NotificationPreferencesState = {
  preferenceGroups: NotificationPreferenceGroup[];
  preferences: NotificationPreferences;
  updateEventPreference: (eventType: NotificationEventType, enabled: boolean) => void;
  updateThresholdPeriod: (
    key: NotificationThresholdKey,
    period: NotificationThresholdPeriod,
  ) => void;
  updateThresholdValue: (key: NotificationThresholdKey, value: string) => void;
};

export function useNotificationPreferences(userId: string): NotificationPreferencesState {
  const [preferences, setPreferences] = useState<NotificationPreferences>(() =>
    loadNotificationPreferences(userId),
  );

  useEffect(() => {
    setPreferences(loadNotificationPreferences(userId));
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
        saveNotificationPreferences(userId, nextPreferences);
        return nextPreferences;
      });
    },
    updateThresholdPeriod: (key, period) => {
      setPreferences((currentPreferences) => {
        const nextPreferences = {
          ...currentPreferences,
          thresholdPeriods: {
            ...currentPreferences.thresholdPeriods,
            [key]: period,
          },
        };
        saveNotificationPreferences(userId, nextPreferences);
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
        saveNotificationPreferences(userId, nextPreferences);
        return nextPreferences;
      });
    },
  };
}

function buildPreferenceGroups(
  preferences: NotificationPreferences,
): NotificationPreferenceGroup[] {
  return NotificationGroupOrder.map((groupId) => ({
    description: NotificationGroupCopy[groupId].description,
    id: groupId,
    items: NotificationEventOrder.filter(
      (eventType) =>
        NotificationEventCopy[eventType].groupId === groupId &&
        !isRequiredNotificationEvent(eventType),
    ).map((eventType) => ({
      description: NotificationEventCopy[eventType].description,
      enabled: preferences.enabledByEvent[eventType],
      label: NotificationEventCopy[eventType].label,
      type: eventType,
    })),
    thresholdFields:
      groupId === "threshold"
        ? (Object.entries(NotificationThresholdCopy).map(([key, fieldCopy]) => ({
            description: fieldCopy.description,
            key: key as NotificationThresholdKey,
            label: fieldCopy.label,
            periodLabel: NotificationUiCopy.periodFieldLabel,
            periodOptions: NotificationThresholdPeriodOrder.map((period) => ({
              label: NotificationThresholdPeriodCopy[period],
              value: period,
            })),
            selectedPeriod:
              preferences.thresholdPeriods[key as NotificationThresholdKey] ??
              NotificationDefaultThresholdPeriods[key as NotificationThresholdKey],
            value: formatThresholdValue(preferences.thresholds[key as NotificationThresholdKey]),
          })) as NotificationPreferenceGroup["thresholdFields"])
        : undefined,
    title: NotificationGroupCopy[groupId].title,
  })) as NotificationPreferenceGroup[];
}

function formatThresholdValue(value: number): string {
  return value > 0 ? String(value) : "";
}
