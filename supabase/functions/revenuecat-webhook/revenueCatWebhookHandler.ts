const ACTIVE_REVENUECAT_EVENT_TYPES = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "UNCANCELLATION",
  "PRODUCT_CHANGE",
  "SUBSCRIPTION_EXTENDED",
  "TEMPORARY_ENTITLEMENT_GRANT",
  "REFUND_REVERSED",
]);
const INACTIVE_REVENUECAT_EVENT_TYPES = new Set(["EXPIRATION"]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
} as const;

type RevenueCatWebhookEvent = {
  aliases?: unknown;
  app_user_id?: unknown;
  entitlement_ids?: unknown;
  expiration_at_ms?: unknown;
  original_app_user_id?: unknown;
  transferred_from?: unknown;
  transferred_to?: unknown;
  type?: unknown;
};

type RevenueCatWebhookPayload = {
  event?: RevenueCatWebhookEvent;
};

type RevenueCatWebhookAdminClient = {
  from: (tableName: "profiles") => {
    update: (values: Record<string, unknown>) => {
      in: (column: string, values: string[]) => Promise<{ data: unknown; error: Error | null }>;
    };
  };
};

type RevenueCatWebhookHandlerOptions = {
  createAdminClient: () => RevenueCatWebhookAdminClient;
  plusEntitlementId: string;
  serviceRoleKey: string;
  supabaseUrl: string;
  webhookAuthorization: string;
};

export async function handleRevenueCatWebhookRequest(
  request: Request,
  options: RevenueCatWebhookHandlerOptions,
): Promise<Response> {
  try {
    if (request.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return createJsonResponse(405, { error: "Method not allowed" });
    }

    if (!options.supabaseUrl || !options.serviceRoleKey || !options.webhookAuthorization) {
      return createJsonResponse(500, { error: "RevenueCat webhook is not configured." });
    }

    if (request.headers.get("Authorization") !== options.webhookAuthorization) {
      return createJsonResponse(401, { error: "Unauthorized" });
    }

    const payload = (await request.json()) as RevenueCatWebhookPayload;
    const event = payload.event;
    if (!event || typeof event.type !== "string") {
      return createJsonResponse(400, { error: "Invalid RevenueCat webhook payload." });
    }

    const userIds = resolveRevenueCatUserIds(event);
    if (userIds.length === 0) {
      return createJsonResponse(200, { skipped: true, success: true, updatedUserCount: 0 });
    }

    const nextTier = resolveNextSubscriptionTier(event, options.plusEntitlementId);
    if (!nextTier) {
      return createJsonResponse(200, {
        ignoredEventType: event.type,
        success: true,
        updatedUserCount: 0,
      });
    }

    const adminClient = options.createAdminClient();
    const { error } = await adminClient
      .from("profiles")
      .update({ subscription_tier: nextTier })
      .in("id", userIds);

    if (error) {
      throw error;
    }

    return createJsonResponse(200, {
      success: true,
      subscriptionTier: nextTier,
      updatedUserCount: userIds.length,
    });
  } catch (error) {
    console.error("[revenuecat-webhook] unexpected error", error);
    return createJsonResponse(500, { error: "Failed to process RevenueCat webhook." });
  }
}

function resolveRevenueCatUserIds(event: RevenueCatWebhookEvent): string[] {
  const candidates = [
    ...readStringValues(event.app_user_id),
    ...readStringValues(event.original_app_user_id),
    ...readStringValues(event.aliases),
    ...readStringValues(event.transferred_to),
  ];
  return [...new Set(candidates.map((value) => value.trim()).filter(isUuid))];
}

function resolveNextSubscriptionTier(
  event: RevenueCatWebhookEvent,
  plusEntitlementId: string,
): "free" | "plus" | null {
  if (typeof event.type !== "string") {
    return null;
  }

  if (INACTIVE_REVENUECAT_EVENT_TYPES.has(event.type)) {
    return "free";
  }

  if (!ACTIVE_REVENUECAT_EVENT_TYPES.has(event.type)) {
    return null;
  }

  const entitlementIds = new Set(readStringValues(event.entitlement_ids));
  if (!entitlementIds.has(plusEntitlementId)) {
    return null;
  }

  if (
    typeof event.expiration_at_ms === "number" &&
    event.expiration_at_ms > 0 &&
    event.expiration_at_ms <= Date.now()
  ) {
    return "free";
  }

  return "plus";
}

function readStringValues(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  return [];
}

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
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
