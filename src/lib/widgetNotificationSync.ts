import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";

import { appPlatform } from "./appPlatform";
import { logAppError } from "./logAppError";
import { updateLedgerWidgetSummary } from "./nativeWidget";
import { parseLedgerWidgetPushPayload, readActiveLedgerWidgetBookId } from "./widgetPushPayload";

const LEDGER_WIDGET_NOTIFICATION_TASK = "moneychecks-ledger-widget-notification-sync";

type NotificationTaskBody = {
  notification?: {
    request?: {
      content?: {
        data?: Record<string, unknown>;
      };
    };
  };
};

if (appPlatform.isNative && !TaskManager.isTaskDefined(LEDGER_WIDGET_NOTIFICATION_TASK)) {
  TaskManager.defineTask(LEDGER_WIDGET_NOTIFICATION_TASK, async ({ data }) => {
    await applyLedgerWidgetNotificationData(
      (data as NotificationTaskBody | undefined)?.notification?.request?.content?.data,
      "background_notification_task",
    );
  });
}

export async function registerLedgerWidgetNotificationSync(): Promise<() => void> {
  if (!appPlatform.isNative) {
    return () => {};
  }

  await Notifications.registerTaskAsync(LEDGER_WIDGET_NOTIFICATION_TASK);
  const subscription = Notifications.addNotificationReceivedListener((notification) => {
    void applyLedgerWidgetNotificationData(
      notification.request.content.data,
      "foreground_notification_listener",
    );
  });

  return () => {
    subscription.remove();
  };
}

async function applyLedgerWidgetNotificationData(
  data: Record<string, unknown> | null | undefined,
  step: string,
): Promise<void> {
  const payload = parseLedgerWidgetPushPayload(data);
  if (!payload) {
    return;
  }

  const activeBookId = readActiveLedgerWidgetBookId();
  if (activeBookId !== payload.bookId) {
    return;
  }

  try {
    await updateLedgerWidgetSummary(payload.summary);
  } catch (error) {
    logAppError("LedgerWidgetNotificationSync", error, {
      bookId: payload.bookId,
      monthKey: payload.monthKey,
      step,
    });
  }
}
