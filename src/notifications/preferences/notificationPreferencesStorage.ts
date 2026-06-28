import { supabase } from "../../lib/supabase";
import type { NotificationPreferencesRow } from "../../types/supabase";
import {
  NotificationDefaultThresholdEnabled,
  NotificationDefaultThresholdPeriods,
  NotificationDefaultThresholds,
  NotificationEventCopy,
  NotificationEventOrder,
  NotificationRequiredEvents,
  NotificationThresholdMessageDefaults,
} from "../config/notificationCopy";
import { clampNotificationThresholdAmount } from "../config/notificationThresholdLimits";
import type {
  NotificationEventType,
  NotificationThresholdKey,
} from "../domain/notificationEvents";
import type { NotificationPreferences } from "./notificationPreferences";

const NOTIFICATION_PREFERENCES_TABLE = "notification_preferences";

export function createDefaultNotificationPreferences(): NotificationPreferences {
  const enabledByEvent = {} as Record<NotificationEventType, boolean>;
  for (const eventType of NotificationEventOrder) {
    enabledByEvent[eventType] = NotificationEventCopy[eventType].defaultEnabled;
  }

  return {
    enabledByEvent,
    enabledThresholds: {
      ...NotificationDefaultThresholdEnabled,
    },
    selectedThresholdPeriod: "day",
    thresholdCopy: {
      ...NotificationThresholdMessageDefaults,
    },
    thresholds: {
      ...NotificationDefaultThresholds,
    },
  };
}

export async function loadNotificationPreferences(
  userId: string,
): Promise<NotificationPreferences> {
  const fallbackPreferences = createDefaultNotificationPreferences();
  const { data, error } = await supabase
    .from(NOTIFICATION_PREFERENCES_TABLE)
    .select(
      "user_id, custom_notification_copy, enabled_by_event, enabled_thresholds, threshold_periods, thresholds",
    )
    .eq("user_id", userId)
    .maybeSingle<NotificationPreferencesRow>();

  if (isMissingCustomNotificationCopyColumnError(error)) {
    return loadLegacyNotificationPreferences(userId, fallbackPreferences);
  }

  if (error || !data) {
    return fallbackPreferences;
  }

  return mergeNotificationPreferences(fallbackPreferences, data);
}

export async function saveNotificationPreferences(
  userId: string,
  preferences: NotificationPreferences,
): Promise<void> {
  const payload = createNotificationPreferencesPayload(userId, preferences);
  const { error } = await supabase
    .from(NOTIFICATION_PREFERENCES_TABLE)
    .upsert(payload, { onConflict: "user_id" });

  if (isMissingCustomNotificationCopyColumnError(error)) {
    const { custom_notification_copy: _customNotificationCopy, ...legacyPayload } = payload;
    const { error: legacyError } = await supabase
      .from(NOTIFICATION_PREFERENCES_TABLE)
      .upsert(legacyPayload, { onConflict: "user_id" });

    if (legacyError) {
      throw legacyError;
    }

    return;
  }

  if (error) {
    throw error;
  }
}

async function loadLegacyNotificationPreferences(
  userId: string,
  fallbackPreferences: NotificationPreferences,
): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from(NOTIFICATION_PREFERENCES_TABLE)
    .select("user_id, enabled_by_event, enabled_thresholds, threshold_periods, thresholds")
    .eq("user_id", userId)
    .maybeSingle<Omit<NotificationPreferencesRow, "custom_notification_copy">>();

  if (error || !data) {
    return fallbackPreferences;
  }

  return mergeNotificationPreferences(fallbackPreferences, {
    ...data,
    custom_notification_copy: null,
  });
}

function createNotificationPreferencesPayload(
  userId: string,
  preferences: NotificationPreferences,
) {
  return {
    enabled_by_event: preferences.enabledByEvent,
    enabled_thresholds: preferences.enabledThresholds,
    custom_notification_copy: {
      expense_limit_exceeded: sanitizeThresholdCopy(preferences.thresholdCopy),
    },
    threshold_periods: NotificationDefaultThresholdPeriods,
    thresholds: preferences.thresholds,
    user_id: userId,
  };
}

function isMissingCustomNotificationCopyColumnError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    (error as { code?: unknown }).code === "PGRST204" &&
    typeof (error as { message?: unknown }).message === "string" &&
    (error as { message: string }).message.includes("custom_notification_copy")
  );
}

function mergeNotificationPreferences(
  fallbackPreferences: NotificationPreferences,
  row: NotificationPreferencesRow,
): NotificationPreferences {
  const enabledByEvent = {
    ...fallbackPreferences.enabledByEvent,
    ...(row.enabled_by_event ?? {}),
  };

  for (const eventType of NotificationRequiredEvents) {
    enabledByEvent[eventType] = true;
  }

  const thresholdState = mergeThresholdState(row);

  return {
    enabledByEvent,
    enabledThresholds: {
      ...createSingleSelectedThresholdState(thresholdState.selectedThresholdKey),
    },
    selectedThresholdPeriod: NotificationDefaultThresholdPeriods[thresholdState.selectedThresholdKey],
    thresholdCopy: mergeThresholdCopy(fallbackPreferences, row),
    thresholds: {
      ...fallbackPreferences.thresholds,
      ...clampNotificationThresholds(thresholdState.thresholds),
    },
  };
}

function mergeThresholdState(row: NotificationPreferencesRow): {
  selectedThresholdKey: NotificationThresholdKey;
  thresholds: NotificationPreferences["thresholds"];
} {
  const nextThresholds = { ...NotificationDefaultThresholds, ...(row.thresholds ?? {}) };
  const nextEnabledThresholds = {
    ...NotificationDefaultThresholdEnabled,
    ...(row.enabled_thresholds ?? {}),
  };
  const legacyThreshold = row.thresholds?.expenseAmount;
  const legacyPeriod = row.threshold_periods?.expenseAmount;

  if (
    typeof legacyThreshold === "number" &&
    !("expenseAmountDay" in (row.thresholds ?? {})) &&
    !("expenseAmountWeek" in (row.thresholds ?? {})) &&
    !("expenseAmountMonth" in (row.thresholds ?? {}))
  ) {
    const legacyKey =
      legacyPeriod === "week"
        ? "expenseAmountWeek"
        : legacyPeriod === "month"
          ? "expenseAmountMonth"
          : "expenseAmountDay";

    nextThresholds[legacyKey] = legacyThreshold;
    nextEnabledThresholds[legacyKey] = legacyThreshold > 0;
  }

  return {
    selectedThresholdKey: resolveSelectedThresholdKey(nextEnabledThresholds),
    thresholds: nextThresholds,
  };
}

function resolveSelectedThresholdKey(
  enabledThresholds: NotificationPreferences["enabledThresholds"],
): NotificationThresholdKey {
  const enabledKey = Object.keys(NotificationDefaultThresholdPeriods).find(
    (key) => enabledThresholds[key as NotificationThresholdKey],
  );

  return (enabledKey as NotificationThresholdKey | undefined) ?? "expenseAmountDay";
}

function createSingleSelectedThresholdState(
  selectedKey: NotificationThresholdKey,
): NotificationPreferences["enabledThresholds"] {
  return Object.fromEntries(
    Object.keys(NotificationDefaultThresholdPeriods).map((key) => [key, key === selectedKey]),
  ) as NotificationPreferences["enabledThresholds"];
}

function mergeThresholdCopy(
  fallbackPreferences: NotificationPreferences,
  row: NotificationPreferencesRow,
): NotificationPreferences["thresholdCopy"] {
  const rowCopy = row.custom_notification_copy?.expense_limit_exceeded;

  return sanitizeThresholdCopy({
    body: rowCopy?.body ?? fallbackPreferences.thresholdCopy.body,
    title: rowCopy?.title ?? fallbackPreferences.thresholdCopy.title,
  });
}

function sanitizeThresholdCopy(
  copy: Partial<NotificationPreferences["thresholdCopy"]>,
): NotificationPreferences["thresholdCopy"] {
  const title = copy.title?.trim();
  const body = copy.body?.trim();

  return {
    body: body || NotificationThresholdMessageDefaults.body,
    title: title || NotificationThresholdMessageDefaults.title,
  };
}

function clampNotificationThresholds(
  thresholds: NotificationPreferences["thresholds"],
): NotificationPreferences["thresholds"] {
  return Object.fromEntries(
    Object.entries(thresholds).map(([key, amount]) => [
      key,
      clampNotificationThresholdAmount(amount),
    ]),
  ) as NotificationPreferences["thresholds"];
}
