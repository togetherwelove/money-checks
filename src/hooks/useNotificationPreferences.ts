import { useEffect, useMemo, useState } from "react";

import {
  NotificationDefaultThresholdEnabled,
  NotificationEntryChangeEventTypes,
  NotificationEntryChangePreferenceCopy,
  NotificationEventCopy,
  NotificationEventOrder,
  NotificationGroupCopy,
  NotificationGroupOrder,
  NotificationThresholdCopy,
  NotificationThresholdFieldLabels,
  isRequiredNotificationEvent,
} from "../notifications/config/notificationCopy";
import { clampNotificationThresholdAmount } from "../notifications/config/notificationThresholdLimits";
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
  updateEventPreference: (
    eventTypes: NotificationEventType | readonly NotificationEventType[],
    enabled: boolean,
  ) => void;
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
    updateEventPreference: (eventTypes, enabled) => {
      const targetEventTypes: readonly NotificationEventType[] = Array.isArray(eventTypes)
        ? eventTypes
        : [eventTypes];
      if (targetEventTypes.some(isRequiredNotificationEvent)) {
        return;
      }

      setPreferences((currentPreferences) => {
        const nextEnabledByEvent = { ...currentPreferences.enabledByEvent };
        for (const eventType of targetEventTypes) {
          nextEnabledByEvent[eventType] = enabled;
        }

        const nextPreferences = {
          ...currentPreferences,
          enabledByEvent: nextEnabledByEvent,
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
      const nextThreshold = clampNotificationThresholdAmount(
        sanitizedValue ? Number(sanitizedValue) : 0,
      );

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
    enabled:
      preferences.enabledThresholds[key as NotificationThresholdKey] ??
      NotificationDefaultThresholdEnabled[key as NotificationThresholdKey],
    key: key as NotificationThresholdKey,
    label: NotificationThresholdFieldLabels[key as NotificationThresholdKey],
    value: formatThresholdValue(preferences.thresholds[key as NotificationThresholdKey]),
  })) as NotificationPreferenceGroup["thresholdFields"];

  const entryChangeEventTypeSet = new Set<NotificationEventType>(NotificationEntryChangeEventTypes);

  return NotificationGroupOrder.map((groupId) => ({
    id: groupId,
    items:
      groupId === "threshold"
        ? []
        : buildNotificationPreferenceItems(groupId, preferences, entryChangeEventTypeSet),
    thresholdFields: groupId === "threshold" ? thresholdFields : undefined,
    title: NotificationGroupCopy[groupId].title,
  })) as NotificationPreferenceGroup[];
}

function buildNotificationPreferenceItems(
  groupId: NotificationPreferenceGroup["id"],
  preferences: NotificationPreferences,
  entryChangeEventTypeSet: Set<NotificationEventType>,
): NotificationPreferenceGroup["items"] {
  let hasAddedEntryChangePreference = false;
  const preferenceItems: NotificationPreferenceGroup["items"] = [];

  for (const eventType of NotificationEventOrder) {
    if (
      NotificationEventCopy[eventType].groupId !== groupId ||
      isRequiredNotificationEvent(eventType)
    ) {
      continue;
    }

    if (entryChangeEventTypeSet.has(eventType)) {
      if (hasAddedEntryChangePreference) {
        continue;
      }

      hasAddedEntryChangePreference = true;
      preferenceItems.push({
        enabled: NotificationEntryChangeEventTypes.every(
          (entryChangeEventType) => preferences.enabledByEvent[entryChangeEventType],
        ),
        eventTypes: NotificationEntryChangeEventTypes,
        label: NotificationEntryChangePreferenceCopy.label,
        type: NotificationEntryChangeEventTypes[0],
      });
      continue;
    }

    preferenceItems.push({
      enabled: preferences.enabledByEvent[eventType],
      helpMessage: NotificationEventCopy[eventType].helpMessage,
      label: NotificationEventCopy[eventType].label,
      type: eventType,
    });
  }

  return preferenceItems;
}

function formatThresholdValue(value: number): string {
  return value > 0 ? String(value) : "";
}
