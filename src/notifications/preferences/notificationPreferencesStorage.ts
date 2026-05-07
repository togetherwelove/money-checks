import { supabase } from "../../lib/supabase";
import type { NotificationPreferencesRow } from "../../types/supabase";
import {
  NotificationDefaultThresholdEnabled,
  NotificationDefaultThresholdPeriods,
  NotificationDefaultThresholds,
  NotificationEventCopy,
  NotificationEventOrder,
  NotificationRequiredEvents,
} from "../config/notificationCopy";
import { clampNotificationThresholdAmount } from "../config/notificationThresholdLimits";
import type { NotificationEventType } from "../domain/notificationEvents";
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
      "user_id, enabled_by_event, enabled_thresholds, summary_timezone, last_monthly_summary_sent_month, threshold_periods, thresholds",
    )
    .eq("user_id", userId)
    .maybeSingle<NotificationPreferencesRow>();

  if (error || !data) {
    return fallbackPreferences;
  }

  return mergeNotificationPreferences(fallbackPreferences, data);
}

export async function saveNotificationPreferences(
  userId: string,
  preferences: NotificationPreferences,
): Promise<void> {
  const summaryTimeZone = resolveCurrentNotificationTimeZone();
  const { error } = await supabase.from(NOTIFICATION_PREFERENCES_TABLE).upsert(
    {
      enabled_by_event: preferences.enabledByEvent,
      enabled_thresholds: preferences.enabledThresholds,
      summary_timezone: summaryTimeZone,
      threshold_periods: NotificationDefaultThresholdPeriods,
      thresholds: preferences.thresholds,
      user_id: userId,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw error;
  }
}

export async function syncNotificationSummaryTimeZone(userId: string): Promise<void> {
  const summaryTimeZone = resolveCurrentNotificationTimeZone();
  if (!summaryTimeZone) {
    return;
  }

  const { error } = await supabase.from(NOTIFICATION_PREFERENCES_TABLE).upsert(
    {
      summary_timezone: summaryTimeZone,
      user_id: userId,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw error;
  }
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
      ...fallbackPreferences.enabledThresholds,
      ...thresholdState.enabledThresholds,
    },
    thresholds: {
      ...fallbackPreferences.thresholds,
      ...clampNotificationThresholds(thresholdState.thresholds),
    },
  };
}

function mergeThresholdState(row: NotificationPreferencesRow): {
  enabledThresholds: NotificationPreferences["enabledThresholds"];
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
    enabledThresholds: nextEnabledThresholds,
    thresholds: nextThresholds,
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

function resolveCurrentNotificationTimeZone(): string | null {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return typeof timeZone === "string" && timeZone.trim() ? timeZone : null;
}
