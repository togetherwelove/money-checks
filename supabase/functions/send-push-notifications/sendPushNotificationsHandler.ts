const EXPO_PUSH_API_URL = "https://exp.host/--/api/v2/push/send";
const ANDROID_NOTIFICATION_CHANNEL_ID = "ledger-updates";
const DEFAULT_NOTIFICATION_ENABLED = true;
const DEFAULT_REQUESTER_DISPLAY_NAME = "사용자";
const EXPO_PUSH_TOKEN_PATTERN = /^(ExponentPushToken|ExpoPushToken)\[[^\]]+\]$/;
const JOIN_REQUEST_NOTIFICATION_TITLE = "새 참여 요청";
const JOIN_REQUEST_NOTIFICATION_BODY = "{requesterName}님이 {bookName} 참여를 요청했어요.";

const REQUIRED_NOTIFICATION_EVENTS = new Set([
  "member_joined_book",
  "member_left_book",
  "member_removed_from_book",
]);

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
} as const;

type AuthenticatedUser = {
  id: string;
};

type BookMemberRole = "editor" | "owner" | "viewer";
type NotificationEventType =
  | "expense_limit_exceeded"
  | "member_joined_book"
  | "member_left_book"
  | "member_removed_from_book"
  | "other_member_created_entry"
  | "other_member_deleted_entry"
  | "other_member_updated_entry";

type BookMembersPushRequest = {
  body: string;
  bookId: string;
  eventType: NotificationEventType;
  excludeUserIds?: string[];
  route: "book-members";
  title: string;
};

type DirectTargetsPushRequest = {
  body: string;
  bookId?: string;
  eventType: NotificationEventType;
  route: "direct-targets";
  targetUserIds: string[];
  title: string;
};

type LatestJoinRequestOwnerPushRequest = {
  route: "latest-join-request-owner";
};

type PushNotificationRequest =
  | BookMembersPushRequest
  | DirectTargetsPushRequest
  | LatestJoinRequestOwnerPushRequest;

type PushDeviceTokenRow = {
  expo_push_token: string;
  platform: "android" | "ios";
  user_id: string;
};

type NotificationPreferencesRow = {
  enabled_by_event: Record<string, boolean> | null;
  user_id: string;
};

type ProfileDisplayNameRow = {
  display_name: string | null;
  id: string;
};

type LedgerBookMemberRow = {
  book_id: string;
  role: BookMemberRole;
  user_id: string;
};

type LedgerBookRow = {
  id: string;
  name: string;
  owner_id: string;
};

type LedgerBookJoinRequestRow = {
  book_id: string;
  created_at: string;
  requester_user_id: string;
  status: "approved" | "pending" | "rejected";
};

type QueryResult<Row> = Promise<{ data: Row[] | Row | null; error: Error | null }>;

export type SendPushNotificationsAdminClient = {
  auth: {
    getUser: (
      accessToken: string,
    ) => Promise<{ data: { user: AuthenticatedUser | null }; error: Error | null }>;
  };
  from: (tableName: string) => unknown;
};

type SendPushNotificationsHandlerOptions = {
  createAdminClient: () => SendPushNotificationsAdminClient;
  serviceRoleKey: string;
  supabaseUrl: string;
};

type JoinRequestOwnerNotification = {
  body: string;
  targetUserIds: string[];
  title: string;
};

type ExpoPushMessage = {
  body: string;
  channelId?: string;
  sound: "default";
  title: string;
  to: string;
};

export async function handleSendPushNotificationsRequest(
  request: Request,
  options: SendPushNotificationsHandlerOptions,
): Promise<Response> {
  try {
    if (request.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return createJsonResponse(405, { error: "Method not allowed" });
    }

    if (!options.supabaseUrl || !options.serviceRoleKey) {
      return createJsonResponse(500, { error: "Push notifications are not configured." });
    }

    const accessToken = extractBearerToken(request.headers.get("Authorization"));
    if (!accessToken) {
      return createJsonResponse(401, { error: "Unauthorized" });
    }

    const adminClient = options.createAdminClient();
    const senderUserId = await resolveAuthenticatedUserId(adminClient, accessToken);
    if (!senderUserId) {
      return createJsonResponse(401, { error: "Unauthorized" });
    }

    const payload = (await request.json()) as PushNotificationRequest;
    const pushMessages = await buildPushMessages(adminClient, payload, senderUserId);
    if (pushMessages.length === 0) {
      return createJsonResponse(200, { sentCount: 0, success: true });
    }

    const expoResponse = await fetch(EXPO_PUSH_API_URL, {
      body: JSON.stringify(pushMessages),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!expoResponse.ok) {
      return createJsonResponse(502, {
        error: await expoResponse.text(),
      });
    }

    const responsePayload = await expoResponse.json();
    return createJsonResponse(200, {
      responsePayload,
      sentCount: pushMessages.length,
      success: true,
    });
  } catch (error) {
    console.error("[send-push-notifications] unexpected error", error);
    return createJsonResponse(500, { error: "Failed to send push notifications." });
  }
}

async function buildPushMessages(
  adminClient: SendPushNotificationsAdminClient,
  payload: PushNotificationRequest,
  senderUserId: string,
): Promise<ExpoPushMessage[]> {
  if (payload.route === "latest-join-request-owner") {
    const joinRequestNotification = await resolveLatestJoinRequestOwnerNotification(
      adminClient,
      senderUserId,
    );
    if (!joinRequestNotification) {
      return [];
    }

    return resolveExpoPushMessages(adminClient, joinRequestNotification.targetUserIds, {
      body: joinRequestNotification.body,
      title: joinRequestNotification.title,
    });
  }

  const targetUserIds = await resolveTargetUserIds(adminClient, payload, senderUserId);
  if (targetUserIds.length === 0) {
    return [];
  }

  const filteredUserIds = await filterRecipientsByPreference(
    adminClient,
    targetUserIds,
    payload.eventType,
  );
  if (filteredUserIds.length === 0) {
    return [];
  }

  return resolveExpoPushMessages(adminClient, filteredUserIds, payload);
}

async function resolveAuthenticatedUserId(
  adminClient: SendPushNotificationsAdminClient,
  accessToken: string,
): Promise<string | null> {
  const {
    data: { user },
    error,
  } = await adminClient.auth.getUser(accessToken);

  if (error || !user?.id) {
    return null;
  }

  return user.id;
}

async function resolveTargetUserIds(
  adminClient: SendPushNotificationsAdminClient,
  payload: BookMembersPushRequest | DirectTargetsPushRequest,
  senderUserId: string,
): Promise<string[]> {
  if (payload.route === "book-members") {
    await assertBookAccess(adminClient, payload.bookId, senderUserId);
    const members = await fetchLedgerBookMembers(adminClient, payload.bookId);
    const excludedUserIds = new Set(payload.excludeUserIds ?? []);

    return members.map((member) => member.user_id).filter((userId) => !excludedUserIds.has(userId));
  }

  if (!payload.bookId) {
    const isSelfOnly = payload.targetUserIds.every((targetUserId) => targetUserId === senderUserId);
    if (!isSelfOnly) {
      throw new Error("Direct target notifications without a book can only target the sender.");
    }

    return payload.targetUserIds;
  }

  const senderRole = await assertBookAccess(adminClient, payload.bookId, senderUserId);
  if (payload.eventType === "member_removed_from_book" && senderRole !== "owner") {
    throw new Error("Only the owner can send member removal notifications.");
  }

  return payload.targetUserIds;
}

async function resolveLatestJoinRequestOwnerNotification(
  adminClient: SendPushNotificationsAdminClient,
  senderUserId: string,
): Promise<JoinRequestOwnerNotification | null> {
  const joinRequestQuery = adminClient.from("ledger_book_join_requests") as {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => {
        eq: (
          nextColumn: string,
          nextValue: string,
        ) => {
          order: (
            orderColumn: string,
            options?: { ascending?: boolean },
          ) => {
            maybeSingle: <Row>() => Promise<{ data: Row | null; error: Error | null }>;
          };
        };
      };
    };
  };
  const { data: joinRequest, error: joinRequestError } = await joinRequestQuery
    .select("book_id, created_at, requester_user_id, status")
    .eq("requester_user_id", senderUserId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .maybeSingle<LedgerBookJoinRequestRow>();

  if (joinRequestError || !joinRequest) {
    return null;
  }

  const ledgerBooksQuery = adminClient.from("ledger_books") as {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => {
        maybeSingle: <Row>() => Promise<{ data: Row | null; error: Error | null }>;
      };
    };
  };
  const { data: book, error: bookError } = await ledgerBooksQuery
    .select("id, name, owner_id")
    .eq("id", joinRequest.book_id)
    .maybeSingle<LedgerBookRow>();

  if (bookError || !book) {
    return null;
  }

  const requesterName = await fetchProfileDisplayName(adminClient, senderUserId);

  return {
    body: JOIN_REQUEST_NOTIFICATION_BODY.replace("{requesterName}", requesterName).replace(
      "{bookName}",
      book.name,
    ),
    targetUserIds: [book.owner_id],
    title: JOIN_REQUEST_NOTIFICATION_TITLE,
  };
}

async function fetchProfileDisplayName(
  adminClient: SendPushNotificationsAdminClient,
  userId: string,
): Promise<string> {
  const profilesQuery = adminClient.from("profiles") as {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => {
        maybeSingle: <Row>() => Promise<{ data: Row | null; error: Error | null }>;
      };
    };
  };
  const { data, error } = await profilesQuery
    .select("id, display_name")
    .eq("id", userId)
    .maybeSingle<ProfileDisplayNameRow>();

  if (error || !data) {
    return DEFAULT_REQUESTER_DISPLAY_NAME;
  }

  return data.display_name?.trim() || DEFAULT_REQUESTER_DISPLAY_NAME;
}

async function filterRecipientsByPreference(
  adminClient: SendPushNotificationsAdminClient,
  targetUserIds: string[],
  eventType: NotificationEventType,
): Promise<string[]> {
  if (REQUIRED_NOTIFICATION_EVENTS.has(eventType)) {
    return targetUserIds;
  }

  const notificationPreferencesQuery = adminClient.from("notification_preferences") as {
    select: (columns: string) => {
      in: (column: string, values: string[]) => QueryResult<NotificationPreferencesRow>;
    };
  };
  const { data, error } = await notificationPreferencesQuery
    .select("user_id, enabled_by_event")
    .in("user_id", targetUserIds);

  if (error || !Array.isArray(data)) {
    return targetUserIds;
  }

  const enabledByUserId = new Map(
    (data as NotificationPreferencesRow[]).map((row) => [
      row.user_id,
      row.enabled_by_event?.[eventType] ?? DEFAULT_NOTIFICATION_ENABLED,
    ]),
  );

  return targetUserIds.filter((targetUserId) => enabledByUserId.get(targetUserId) !== false);
}

async function resolveExpoPushMessages(
  adminClient: SendPushNotificationsAdminClient,
  targetUserIds: string[],
  content: { body: string; title: string },
): Promise<ExpoPushMessage[]> {
  const pushDeviceTokensQuery = adminClient.from("push_device_tokens") as {
    select: (columns: string) => {
      in: (column: string, values: string[]) => QueryResult<PushDeviceTokenRow>;
    };
  };
  const { data, error } = await pushDeviceTokensQuery
    .select("expo_push_token, platform, user_id")
    .in("user_id", targetUserIds);

  if (error || !Array.isArray(data)) {
    return [];
  }

  return (data as PushDeviceTokenRow[])
    .filter((row) => EXPO_PUSH_TOKEN_PATTERN.test(row.expo_push_token))
    .map((row) => ({
      body: content.body,
      ...(row.platform === "android" ? { channelId: ANDROID_NOTIFICATION_CHANNEL_ID } : {}),
      sound: "default",
      title: content.title,
      to: row.expo_push_token,
    }));
}

async function assertBookAccess(
  adminClient: SendPushNotificationsAdminClient,
  bookId: string,
  userId: string,
): Promise<BookMemberRole> {
  const membersQuery = adminClient.from("ledger_book_members") as {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => {
        eq: (
          nextColumn: string,
          nextValue: string,
        ) => {
          maybeSingle: <Row>() => Promise<{ data: Row | null; error: Error | null }>;
        };
      };
    };
  };
  const { data, error } = await membersQuery
    .select("book_id, role, user_id")
    .eq("book_id", bookId)
    .eq("user_id", userId)
    .maybeSingle<LedgerBookMemberRow>();

  if (error || !data) {
    throw new Error("Unauthorized book access.");
  }

  return data.role;
}

async function fetchLedgerBookMembers(
  adminClient: SendPushNotificationsAdminClient,
  bookId: string,
): Promise<LedgerBookMemberRow[]> {
  const membersQuery = adminClient.from("ledger_book_members") as {
    select: (columns: string) => {
      eq: (column: string, value: string) => QueryResult<LedgerBookMemberRow>;
    };
  };
  const { data, error } = await membersQuery.select("book_id, role, user_id").eq("book_id", bookId);

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data as LedgerBookMemberRow[];
}

function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice("Bearer ".length).trim();
}

function createJsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
