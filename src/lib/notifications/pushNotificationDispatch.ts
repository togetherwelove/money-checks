import type { NotificationEvent } from "../../notifications/domain/notificationEvents";
import type { LedgerWidgetSummary } from "../../types/widget";
import { supabase, supabasePublishableKey, supabaseUrl } from "../supabase";
import { buildLedgerWidgetPushPayload } from "../widgetPushPayload";

type BookMembersPushRequest = {
  bookId: string;
  event: NotificationEvent;
  excludeUserIds?: string[];
  route: "book-members";
  widget?: PushWidgetSummaryPayload;
  widgetData?: SerializedLedgerWidgetPushPayload;
};

type DirectTargetsPushRequest = {
  bookId?: string;
  event: NotificationEvent;
  route: "direct-targets";
  targetUserIds: string[];
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
const PUSH_NOTIFICATION_RATE_LIMIT_STATUS = 429;

export class PushNotificationRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "PushNotificationRequestError";
  }
}

export function isPushNotificationRateLimitError(error: unknown): boolean {
  return (
    error instanceof PushNotificationRequestError &&
    error.status === PUSH_NOTIFICATION_RATE_LIMIT_STATUS
  );
}

export async function sendPushNotificationToBookMembers(
  bookId: string,
  event: NotificationEvent,
  excludeUserIds: string[],
  widget?: PushWidgetSummaryPayload,
): Promise<void> {
  await sendPushNotification({
    bookId,
    event,
    excludeUserIds,
    route: "book-members",
    widget,
  });
}

export async function sendPushNotificationToUsers(
  event: NotificationEvent,
  targetUserIds: string[],
  bookId?: string,
): Promise<void> {
  await sendPushNotificationContentToUsers(targetUserIds, event, bookId);
}

export async function sendPushNotificationContentToUsers(
  targetUserIds: string[],
  event: NotificationEvent,
  bookId?: string,
): Promise<void> {
  await sendPushNotification({
    bookId,
    event,
    route: "direct-targets",
    targetUserIds,
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
    throw new PushNotificationRequestError(
      responseText
        ? `send-push-notifications returned ${response.status}: ${responseText}`
        : `send-push-notifications returned ${response.status}.`,
      response.status,
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
