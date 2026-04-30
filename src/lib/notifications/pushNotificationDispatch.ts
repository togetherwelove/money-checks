import { buildNotificationContent } from "../../notifications/content/buildNotificationContent";
import type { NotificationEvent } from "../../notifications/domain/notificationEvents";
import type { LedgerWidgetSummary } from "../../types/widget";
import { supabase, supabasePublishableKey, supabaseUrl } from "../supabase";
import { buildLedgerWidgetPushPayload } from "../widgetPushPayload";

type BookMembersPushRequest = {
  body: string;
  bookId: string;
  eventType: NotificationEvent["type"];
  excludeUserIds?: string[];
  route: "book-members";
  title: string;
  widget?: PushWidgetSummaryPayload;
  widgetData?: SerializedLedgerWidgetPushPayload;
};

type DirectTargetsPushRequest = {
  body: string;
  bookId?: string;
  eventType: NotificationEvent["type"];
  route: "direct-targets";
  targetUserIds: string[];
  title: string;
  widget?: PushWidgetSummaryPayload;
  widgetData?: SerializedLedgerWidgetPushPayload;
};

type LatestJoinRequestOwnerPushRequest = {
  route: "latest-join-request-owner";
};

type PushNotificationRequest =
  | BookMembersPushRequest
  | DirectTargetsPushRequest
  | LatestJoinRequestOwnerPushRequest;

type PushWidgetSummaryPayload = {
  monthKey: string;
  summary: LedgerWidgetSummary;
};
type SerializedLedgerWidgetPushPayload = ReturnType<typeof buildLedgerWidgetPushPayload>;

const PUSH_NOTIFICATIONS_FUNCTION = "send-push-notifications";
const PUSH_NOTIFICATIONS_ENDPOINT = `${supabaseUrl}/functions/v1/${PUSH_NOTIFICATIONS_FUNCTION}`;

export async function sendPushNotificationToBookMembers(
  bookId: string,
  event: NotificationEvent,
  excludeUserIds: string[],
  widget?: PushWidgetSummaryPayload,
): Promise<void> {
  const notificationContent = buildNotificationContent(event);
  await sendPushNotification({
    body: notificationContent.body,
    bookId,
    eventType: event.type,
    excludeUserIds,
    route: "book-members",
    title: notificationContent.title,
    widget,
  });
}

export async function sendPushNotificationToUsers(
  event: NotificationEvent,
  targetUserIds: string[],
  bookId?: string,
): Promise<void> {
  const notificationContent = buildNotificationContent(event);
  await sendPushNotificationContentToUsers(
    notificationContent.title,
    notificationContent.body,
    targetUserIds,
    event.type,
    bookId,
  );
}

export async function sendPushNotificationContentToUsers(
  title: string,
  body: string,
  targetUserIds: string[],
  eventType: NotificationEvent["type"],
  bookId?: string,
): Promise<void> {
  await sendPushNotification({
    body,
    bookId,
    eventType,
    route: "direct-targets",
    targetUserIds,
    title,
  });
}

export async function sendPendingJoinRequestNotification(): Promise<void> {
  await sendPushNotification({
    route: "latest-join-request-owner",
  });
}

async function sendPushNotification(request: PushNotificationRequest): Promise<void> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  const accessToken = session?.access_token?.trim();
  if (!accessToken) {
    throw new Error("Push notification request requires an authenticated session.");
  }

  const response = await fetch(PUSH_NOTIFICATIONS_ENDPOINT, {
    body: JSON.stringify(serializePushNotificationRequest(request)),
    headers: {
      apikey: supabasePublishableKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    const responseText = await readResponseText(response);
    throw new Error(
      responseText
        ? `send-push-notifications returned ${response.status}: ${responseText}`
        : `send-push-notifications returned ${response.status}.`,
    );
  }
}

function serializePushNotificationRequest(
  request: PushNotificationRequest,
): PushNotificationRequest {
  if (!("widget" in request) || !request.widget) {
    return request;
  }

  if (!("bookId" in request) || !request.bookId) {
    return request;
  }

  const { widget, ...notificationRequest } = request;
  return {
    ...notificationRequest,
    widgetData: buildLedgerWidgetPushPayload(request.bookId, widget.monthKey, widget.summary),
  };
}

async function readResponseText(response: Response): Promise<string | null> {
  try {
    const rawText = await response.text();
    return rawText.trim() || null;
  } catch {
    return null;
  }
}
