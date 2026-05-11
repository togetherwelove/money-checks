import { translate } from "../_shared/i18n/translate.ts";

const EXPO_PUSH_API_URL = "https://exp.host/--/api/v2/push/send";
const ANDROID_NOTIFICATION_CHANNEL_ID = "ledger-updates";
const DEFAULT_NOTIFICATION_ENABLED = true;
const EXPO_PUSH_TOKEN_PATTERN = /^(ExponentPushToken|ExpoPushToken)\[[^\]]+\]$/;
const NOTIFICATION_ACTION_ROUTES = {
  allEntries: "all-entries",
  calendar: "calendar",
  charts: "charts",
  share: "share",
} as const;
const NOTIFICATION_CATEGORY_IDS = {
  entryChange: "ledger_entry_change",
  expenseThreshold: "expense_threshold",
  joinRequest: "ledger_join_request",
  ledgerBookUpdate: "ledger_book_update",
} as const;
const PUSH_NOTIFICATION_FUNCTION_NAME = "send-push-notifications";
const PUSH_NOTIFICATION_MINIMUM_INVOCATION_INTERVAL = "10 seconds";
const PUSH_NOTIFICATION_MAX_TARGET_USER_COUNT = 20;
const PUSH_NOTIFICATION_MAX_EXCLUDED_USER_COUNT = 20;
const PUSH_CURRENCY_FORMAT_CONFIG = {
  KRW: {
    locale: "ko-KR",
    prefix: "",
    suffix: "원",
  },
  USD: {
    locale: "en-US",
    prefix: "USD ",
    suffix: "",
  },
} as const;

const REQUIRED_NOTIFICATION_EVENTS = new Set([
  "member_joined_book",
  "member_left_book",
  "member_removed_from_book",
]);
const NOTIFICATION_EVENT_TYPES = new Set([
  "expense_limit_exceeded",
  "member_joined_book",
  "member_left_book",
  "member_removed_from_book",
  "other_member_created_entry",
]);

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
} as const;

type AuthenticatedUser = {
  id: string;
};

type BookMemberRole = "editor" | "owner" | "viewer";
type LedgerEntryType = "expense" | "income";
type NotificationThresholdPeriod = "day" | "week" | "month";
type PushCurrency = keyof typeof PUSH_CURRENCY_FORMAT_CONFIG;
type NotificationEventType =
  | "expense_limit_exceeded"
  | "member_joined_book"
  | "member_left_book"
  | "member_removed_from_book"
  | "other_member_created_entry";
type NotificationEvent = {
  type: NotificationEventType;
  actorName?: string;
  amount?: number;
  bookName?: string;
  category?: string;
  date?: string;
  entryType?: LedgerEntryType;
  note?: string;
  period?: NotificationThresholdPeriod;
  targetName?: string;
  thresholdAmount?: number;
  totalAmount?: number;
};

type BookMembersPushRequest = {
  bookId: string;
  event: NotificationEvent;
  excludeUserIds?: string[];
  route: "book-members";
  widgetData?: WidgetPushData;
};

type DirectTargetsPushRequest = {
  bookId?: string;
  event: NotificationEvent;
  route: "direct-targets";
  targetUserIds: string[];
  widgetData?: WidgetPushData;
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

type ProfilePreferredLocaleRow = {
  default_currency: string | null;
  id: string;
  preferred_locale: string | null;
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
  rpc: (
    functionName: "try_acquire_function_invocation_lock",
    args: {
      minimum_interval: string;
      target_function_name: string;
    },
  ) => Promise<{ data: boolean | null; error: Error | null }>;
};

type SendPushNotificationsHandlerOptions = {
  createAdminClient: () => SendPushNotificationsAdminClient;
  serviceRoleKey: string;
  supabaseUrl: string;
};

type JoinRequestOwnerNotification = {
  bookName: string;
  requesterName: string;
  targetUserIds: string[];
};

type ExpoPushMessage = {
  badge?: number;
  body: string;
  categoryId?: string;
  channelId?: string;
  data?: Record<string, unknown>;
  sound: "default";
  title: string;
  to: string;
};

type ExpoPushContent = {
  body: string;
  categoryId?: string;
  data?: Record<string, unknown>;
  title: string;
};

type ExpoPushContentResolver =
  | ExpoPushContent
  | ((preferences: ProfilePushPreferences) => ExpoPushContent);
type ProfilePushPreferences = {
  currency: PushCurrency;
  locale: string | null;
};

type WidgetPushData = {
  actionRoute?: NotificationActionRoute;
  bookId: string;
  kind: "ledger_widget_summary";
  monthKey: string;
  summary: string;
};

type NotificationActionRoute =
  (typeof NOTIFICATION_ACTION_ROUTES)[keyof typeof NOTIFICATION_ACTION_ROUTES];

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
    if (!isValidPushNotificationRequest(payload)) {
      return createJsonResponse(400, { error: "Invalid push notification request." });
    }

    const acquiredSendSlot = await acquirePushNotificationSendSlot(
      adminClient,
      payload,
      senderUserId,
    );
    if (!acquiredSendSlot) {
      return createJsonResponse(429, {
        error: "Push notification request was invoked too recently.",
        success: false,
      });
    }

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

async function acquirePushNotificationSendSlot(
  adminClient: SendPushNotificationsAdminClient,
  payload: PushNotificationRequest,
  senderUserId: string,
): Promise<boolean> {
  const { data, error } = await adminClient.rpc("try_acquire_function_invocation_lock", {
    minimum_interval: PUSH_NOTIFICATION_MINIMUM_INVOCATION_INTERVAL,
    target_function_name: buildPushNotificationLockName(payload, senderUserId),
  });

  if (error) {
    throw error;
  }

  return data === true;
}

function buildPushNotificationLockName(
  payload: PushNotificationRequest,
  senderUserId: string,
): string {
  if (payload.route === "latest-join-request-owner") {
    return [PUSH_NOTIFICATION_FUNCTION_NAME, payload.route, senderUserId].join(":");
  }

  const bookKey = "bookId" in payload && payload.bookId ? payload.bookId : "self";
  const targetKey =
    payload.route === "direct-targets"
      ? [...new Set(payload.targetUserIds)].sort().join(",")
      : "book-members";
  return [
    PUSH_NOTIFICATION_FUNCTION_NAME,
    payload.route,
    senderUserId,
    bookKey,
    payload.event.type,
    targetKey,
  ].join(":");
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

    return resolveExpoPushMessages(
      adminClient,
      joinRequestNotification.targetUserIds,
      (preferences) => ({
        body: translate(preferences.locale, "push.joinRequest.body", {
          bookName: joinRequestNotification.bookName,
          requesterName: joinRequestNotification.requesterName,
        }),
        categoryId: NOTIFICATION_CATEGORY_IDS.joinRequest,
        data: {
          actionRoute: NOTIFICATION_ACTION_ROUTES.share,
        },
        title: translate(preferences.locale, "push.joinRequest.title"),
      }),
    );
  }

  const targetUserIds = await resolveTargetUserIds(adminClient, payload, senderUserId);
  if (targetUserIds.length === 0) {
    return [];
  }

  const filteredUserIds = await filterRecipientsByPreference(
    adminClient,
    targetUserIds,
    payload.event.type,
  );
  if (filteredUserIds.length === 0) {
    return [];
  }

  return resolveExpoPushMessages(adminClient, filteredUserIds, (preferences) =>
    buildExpoPushContent(payload.event, payload.widgetData, preferences),
  );
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
  const members = await fetchLedgerBookMembers(adminClient, payload.bookId);
  const memberUserIds = new Set(members.map((member) => member.user_id));

  if (payload.event.type === "member_removed_from_book") {
    if (senderRole !== "owner") {
      throw new Error("Only the owner can send member removal notifications.");
    }

    if (payload.targetUserIds.length > 1) {
      throw new Error("Member removal notifications can target one user at a time.");
    }
  }

  const unauthorizedTargetUserIds = payload.targetUserIds.filter(
    (targetUserId) => !memberUserIds.has(targetUserId),
  );
  if (unauthorizedTargetUserIds.length > 0) {
    throw new Error("Direct target notifications can only target book members.");
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
    bookName: book.name,
    requesterName,
    targetUserIds: [book.owner_id],
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
    return translate(null, "push.fallbacks.member");
  }

  return data.display_name?.trim() || translate(null, "push.fallbacks.member");
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
  content: ExpoPushContentResolver,
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

  const pushPreferencesByUserId = await fetchProfilePushPreferencesMap(adminClient, targetUserIds);

  return (data as PushDeviceTokenRow[])
    .filter((row) => EXPO_PUSH_TOKEN_PATTERN.test(row.expo_push_token))
    .map((row) => {
      const resolvedContent =
        typeof content === "function"
          ? content(
              pushPreferencesByUserId.get(row.user_id) ?? {
                currency: "KRW",
                locale: null,
              },
            )
          : content;

      return {
        body: resolvedContent.body,
        ...(resolvedContent.categoryId ? { categoryId: resolvedContent.categoryId } : {}),
        ...(resolvedContent.data && Object.keys(resolvedContent.data).length > 0
          ? { data: resolvedContent.data }
          : {}),
        ...(row.platform === "android" ? { channelId: ANDROID_NOTIFICATION_CHANNEL_ID } : {}),
        ...(row.platform === "ios" ? { badge: 1 } : {}),
        sound: "default",
        title: resolvedContent.title,
        to: row.expo_push_token,
      };
    });
}

async function fetchProfilePushPreferencesMap(
  adminClient: SendPushNotificationsAdminClient,
  targetUserIds: string[],
): Promise<Map<string, ProfilePushPreferences>> {
  const profilesQuery = adminClient.from("profiles") as {
    select: (columns: string) => {
      in: (column: string, values: string[]) => QueryResult<ProfilePreferredLocaleRow>;
    };
  };
  const { data, error } = await profilesQuery
    .select("id, preferred_locale, default_currency")
    .in("id", targetUserIds);

  if (error || !Array.isArray(data)) {
    return new Map();
  }

  return new Map(
    (data as ProfilePreferredLocaleRow[]).map((row) => [
      row.id,
      {
        currency: resolvePushCurrency(row.default_currency),
        locale: row.preferred_locale,
      },
    ]),
  );
}

function buildExpoPushContent(
  event: NotificationEvent,
  widgetData?: WidgetPushData,
  preferences: ProfilePushPreferences = { currency: "KRW", locale: null },
): ExpoPushContent {
  const notificationContent = buildNotificationContent(event, preferences);
  const categoryId = resolveCategoryIdForEvent(event.type);
  const actionRoute = resolveActionRouteForEvent(event.type);
  const data = {
    ...widgetData,
    ...(actionRoute ? { actionRoute } : {}),
  };

  return {
    ...notificationContent,
    ...(categoryId ? { categoryId } : {}),
    ...(Object.keys(data).length > 0 ? { data } : {}),
  };
}

function resolvePushCategoryLabel(event: NotificationEvent, locale?: string | null): string {
  const rawCategory = readText(event.category, translate(locale, "push.fallbacks.uncategorized"));
  if (!event.entryType) {
    return rawCategory;
  }

  const categoryKey = `categories.${event.entryType}.${rawCategory}`;
  const translatedCategory = translate(locale, categoryKey);
  return translatedCategory === categoryKey ? rawCategory : translatedCategory;
}

function buildNotificationContent(
  event: NotificationEvent,
  preferences: ProfilePushPreferences,
): { body: string; title: string } {
  const locale = preferences.locale;
  const actorName = readText(event.actorName, translate(locale, "push.fallbacks.member"));
  const bookName = readText(event.bookName, translate(locale, "push.fallbacks.sharedLedger"));
  const category = resolvePushCategoryLabel(event, locale);
  const amountLabel =
    typeof event.amount === "number" ? formatCurrency(event.amount, preferences.currency) : "0";
  const totalAmountLabel =
    typeof event.totalAmount === "number"
      ? formatCurrency(event.totalAmount, preferences.currency)
      : "0";
  const periodLabel = resolvePushPeriodLabel(event.period, locale);

  if (event.type === "expense_limit_exceeded") {
    return {
      body: translate(locale, "push.expenseLimitExceeded.body", {
        period: periodLabel,
        totalAmount: totalAmountLabel,
      }),
      title: translate(locale, "push.expenseLimitExceeded.title"),
    };
  }

  if (event.type === "member_joined_book") {
    return {
      body: translate(locale, "push.memberJoinedBook.body", { actorName, bookName }),
      title: translate(locale, "push.memberJoinedBook.title"),
    };
  }

  if (event.type === "member_left_book") {
    return {
      body: translate(locale, "push.memberLeftBook.body", { actorName, bookName }),
      title: translate(locale, "push.memberLeftBook.title"),
    };
  }

  if (event.type === "member_removed_from_book") {
    return {
      body: translate(locale, "push.memberRemovedFromBook.body", { actorName, bookName }),
      title: translate(locale, "push.memberRemovedFromBook.title"),
    };
  }

  const entryCreatedBodyKey = resolveEntryCreatedBodyTranslationKey(event.entryType);

  return {
    body: translate(locale, entryCreatedBodyKey, {
      actorName,
      amount: amountLabel,
      category,
    }),
    title: translate(locale, "push.entryCreated.title"),
  };
}

function resolveEntryCreatedBodyTranslationKey(entryType?: LedgerEntryType): string {
  if (entryType === "expense") {
    return "push.entryCreated.expenseBody";
  }

  if (entryType === "income") {
    return "push.entryCreated.incomeBody";
  }

  return "push.entryCreated.body";
}

function resolvePushPeriodLabel(
  period: NotificationThresholdPeriod | undefined,
  locale?: string | null,
): string {
  if (!period) {
    return translate(locale, "push.fallbacks.period");
  }

  return translate(locale, `push.periods.${period}`);
}

function resolveCategoryIdForEvent(eventType?: NotificationEventType): string | null {
  if (eventType === "other_member_created_entry") {
    return NOTIFICATION_CATEGORY_IDS.entryChange;
  }

  if (eventType === "expense_limit_exceeded") {
    return NOTIFICATION_CATEGORY_IDS.expenseThreshold;
  }

  if (
    eventType === "member_joined_book" ||
    eventType === "member_left_book" ||
    eventType === "member_removed_from_book"
  ) {
    return NOTIFICATION_CATEGORY_IDS.ledgerBookUpdate;
  }

  return null;
}

function resolveActionRouteForEvent(
  eventType?: NotificationEventType,
): NotificationActionRoute | null {
  if (eventType === "other_member_created_entry") {
    return NOTIFICATION_ACTION_ROUTES.allEntries;
  }

  if (eventType === "expense_limit_exceeded") {
    return NOTIFICATION_ACTION_ROUTES.charts;
  }

  return null;
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

function isValidPushNotificationRequest(value: PushNotificationRequest): boolean {
  if (!value || typeof value !== "object" || !("route" in value)) {
    return false;
  }

  if (value.route === "latest-join-request-owner") {
    return true;
  }

  if (value.route !== "book-members" && value.route !== "direct-targets") {
    return false;
  }

  if (!isNotificationEvent((value as { event?: unknown }).event)) {
    return false;
  }

  if (value.route === "book-members") {
    const request = value as BookMembersPushRequest;
    return (
      typeof request.bookId === "string" &&
      isStringArrayWithinLimit(
        request.excludeUserIds ?? [],
        PUSH_NOTIFICATION_MAX_EXCLUDED_USER_COUNT,
      )
    );
  }

  const request = value as DirectTargetsPushRequest;
  return isStringArrayWithinLimit(request.targetUserIds, PUSH_NOTIFICATION_MAX_TARGET_USER_COUNT);
}

function isStringArrayWithinLimit(value: unknown, maxLength: number): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= maxLength &&
    value.every((item) => typeof item === "string")
  );
}

function isNotificationEvent(value: unknown): value is NotificationEvent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<NotificationEvent>;
  return typeof candidate.type === "string" && NOTIFICATION_EVENT_TYPES.has(candidate.type);
}

function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice("Bearer ".length).trim();
}

function readText(value: string | undefined, fallback: string): string {
  return value?.trim() || fallback;
}

function resolvePushCurrency(value?: string | null): PushCurrency {
  return value === "USD" ? "USD" : "KRW";
}

function formatCurrency(amount: number, currency: PushCurrency): string {
  const config = PUSH_CURRENCY_FORMAT_CONFIG[currency];
  const amountLabel = new Intl.NumberFormat(config.locale).format(amount);

  return `${config.prefix}${amountLabel}${config.suffix}`;
}

function createJsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Cache-Control": "no-store",
      "Content-Type": "application/json",
    },
  });
}
