import { useEffect, useMemo, useState } from "react";

import { logAppError } from "../lib/logAppError";
import {
  NotificationDefaultThresholdEnabled,
  NotificationEntryChangeEventTypes,
  NotificationEntryChangePreferenceCopy,
  NotificationEventCopy,
  NotificationEventOrder,
  NotificationGroupCopy,
  NotificationGroupOrder,
  NotificationThresholdCopy,
  NotificationDefaultThresholdPeriods,
  NotificationThresholdFieldLabels,
  NotificationThresholdMessageDefaults,
  isRequiredNotificationEvent,
} from "../notifications/config/notificationCopy";
import { clampNotificationThresholdAmount } from "../notifications/config/notificationThresholdLimits";
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
  createDefaultNotificationPreferences,
  loadNotificationPreferences,
  saveNotificationPreferences,
} from "../notifications/preferences/notificationPreferencesStorage";
import { sanitizeAmountDigits } from "../utils/amount";

type NotificationPreferencesState = {
  preferenceGroups: NotificationPreferenceGroup[];
  preferences: NotificationPreferences;
  updateEventPreference: (
    eventTypes: NotificationEventType | readonly NotificationEventType[],
    enabled: boolean,
  ) => void;
  updateThresholdCopy: (field: "body" | "title", value: string) => void;
  updateThresholdEnabled: (enabled: boolean) => void;
  updateThresholdPeriod: (period: NotificationThresholdPeriod) => void;
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
        void persistNotificationPreferences(userId, nextPreferences);
        return nextPreferences;
      });
    },
    updateThresholdCopy: (field, value) => {
      const nextValue = sanitizeThresholdCopyValue(field, value);

      setPreferences((currentPreferences) => {
        const nextPreferences = {
          ...currentPreferences,
          thresholdCopy: {
            ...currentPreferences.thresholdCopy,
            [field]: nextValue,
          },
        };
        void persistNotificationPreferences(userId, nextPreferences);
        return nextPreferences;
      });
    },
    updateThresholdEnabled: (enabled) => {
      setPreferences((currentPreferences) => {
        const selectedKey = resolveThresholdKeyFromPeriod(currentPreferences.selectedThresholdPeriod);
        const nextPreferences = {
          ...currentPreferences,
          enabledThresholds: createSingleSelectedThresholdState(selectedKey, enabled),
        };
        void persistNotificationPreferences(userId, nextPreferences);
        return nextPreferences;
      });
    },
    updateThresholdPeriod: (period) => {
      const selectedKey = resolveThresholdKeyFromPeriod(period);

      setPreferences((currentPreferences) => {
        const isEnabled = hasEnabledThreshold(currentPreferences.enabledThresholds);
        const nextPreferences = {
          ...currentPreferences,
          enabledThresholds: createSingleSelectedThresholdState(selectedKey, isEnabled),
          selectedThresholdPeriod: period,
        };
        void persistNotificationPreferences(userId, nextPreferences);
        return nextPreferences;
      });
    },
    updateThresholdValue: (key, value) => {
      const sanitizedValue = sanitizeAmountDigits(value);
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
        void persistNotificationPreferences(userId, nextPreferences);
        return nextPreferences;
      });
    },
  };
}

function buildPreferenceGroups(
  preferences: NotificationPreferences,
): NotificationPreferenceGroup[] {
  const selectedThresholdKey = resolveThresholdKeyFromPeriod(preferences.selectedThresholdPeriod);
  const thresholdSettings: NotificationPreferenceGroup["thresholdSettings"] = {
    amountValue: formatThresholdValue(preferences.thresholds[selectedThresholdKey]),
    body: preferences.thresholdCopy.body,
    enabled: preferences.enabledThresholds[selectedThresholdKey],
    periodOptions: Object.keys(NotificationThresholdCopy).map((key) => ({
      key: key as NotificationThresholdKey,
      label: NotificationThresholdFieldLabels[key as NotificationThresholdKey],
    })),
    selectedKey: selectedThresholdKey,
    title: preferences.thresholdCopy.title,
  };

  const entryChangeEventTypeSet = new Set<NotificationEventType>(NotificationEntryChangeEventTypes);

  return NotificationGroupOrder.map((groupId) => ({
    id: groupId,
    items:
      groupId === "threshold"
        ? []
        : buildNotificationPreferenceItems(groupId, preferences, entryChangeEventTypeSet),
    thresholdSettings: groupId === "threshold" ? thresholdSettings : undefined,
    title: NotificationGroupCopy[groupId].title,
  })) as NotificationPreferenceGroup[];
}

function resolveThresholdKeyFromPeriod(period: NotificationThresholdPeriod): NotificationThresholdKey {
  const matchedKey = Object.entries(NotificationDefaultThresholdPeriods).find(
    ([, thresholdPeriod]) => thresholdPeriod === period,
  )?.[0] as NotificationThresholdKey | undefined;

  return matchedKey ?? "expenseAmountDay";
}

function createSingleSelectedThresholdState(
  selectedKey: NotificationThresholdKey,
  isEnabled: boolean,
): NotificationPreferences["enabledThresholds"] {
  return Object.fromEntries(
    Object.keys(NotificationDefaultThresholdEnabled).map((key) => [
      key,
      isEnabled && key === selectedKey,
    ]),
  ) as NotificationPreferences["enabledThresholds"];
}

function hasEnabledThreshold(
  enabledThresholds: NotificationPreferences["enabledThresholds"],
): boolean {
  return Object.values(enabledThresholds).some(Boolean);
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

function sanitizeThresholdCopyValue(field: "body" | "title", value: string): string {
  const trimmedValue = value.trim();
  if (trimmedValue) {
    return trimmedValue;
  }

  return NotificationThresholdMessageDefaults[field];
}

async function persistNotificationPreferences(
  userId: string,
  preferences: NotificationPreferences,
): Promise<void> {
  try {
    await saveNotificationPreferences(userId, preferences);
  } catch (error) {
    logAppError("NotificationPreferences", error, {
      step: "save_notification_preferences",
      userId,
    });
  }
}
