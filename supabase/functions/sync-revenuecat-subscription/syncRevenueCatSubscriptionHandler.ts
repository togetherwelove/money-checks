const REVENUECAT_CUSTOMERS_BASE_URL = "https://api.revenuecat.com/v1/subscribers";
const ACTIVE_SUBSCRIPTION_TIER = "plus";
const INACTIVE_SUBSCRIPTION_TIER = "free";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
} as const;

type SupabaseAuthUser = {
  id: string;
};

type SyncSubscriptionAdminClient = {
  auth: {
    getUser: (
      jwt: string,
    ) => Promise<{ data: { user: SupabaseAuthUser | null }; error: Error | null }>;
  };
  from: (tableName: "profiles") => {
    update: (values: Record<string, unknown>) => {
      eq: (column: string, value: string) => Promise<{ data: unknown; error: Error | null }>;
    };
  };
};

type SyncRevenueCatSubscriptionHandlerOptions = {
  createAdminClient: () => SyncSubscriptionAdminClient;
  plusEntitlementId: string;
  revenueCatSecretApiKey: string;
  serviceRoleKey: string;
  supabaseUrl: string;
};

type RevenueCatSubscriberResponse = {
  subscriber?: {
    entitlements?: Record<string, RevenueCatEntitlement | undefined>;
  };
};

type RevenueCatEntitlement = {
  expires_date?: string | null;
};

export async function handleSyncRevenueCatSubscriptionRequest(
  request: Request,
  options: SyncRevenueCatSubscriptionHandlerOptions,
): Promise<Response> {
  try {
    if (request.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return createJsonResponse(405, { error: "Method not allowed" });
    }

    if (!options.supabaseUrl || !options.serviceRoleKey || !options.revenueCatSecretApiKey) {
      return createJsonResponse(500, { error: "Subscription sync is not configured." });
    }

    const jwt = readBearerToken(request.headers.get("Authorization"));
    if (!jwt) {
      return createJsonResponse(401, { error: "Unauthorized" });
    }

    const adminClient = options.createAdminClient();
    const { data: userData, error: userError } = await adminClient.auth.getUser(jwt);
    const userId = userData.user?.id;
    if (userError || !userId) {
      return createJsonResponse(401, { error: "Unauthorized" });
    }

    const nextTier = await fetchRevenueCatSubscriptionTier({
      appUserId: userId,
      plusEntitlementId: options.plusEntitlementId,
      revenueCatSecretApiKey: options.revenueCatSecretApiKey,
    });

    const { error: updateError } = await adminClient
      .from("profiles")
      .update({ subscription_tier: nextTier })
      .eq("id", userId);

    if (updateError) {
      throw updateError;
    }

    return createJsonResponse(200, {
      success: true,
      subscriptionTier: nextTier,
    });
  } catch (error) {
    console.error("[sync-revenuecat-subscription] unexpected error", error);
    return createJsonResponse(500, { error: "Failed to sync subscription tier." });
  }
}

async function fetchRevenueCatSubscriptionTier({
  appUserId,
  plusEntitlementId,
  revenueCatSecretApiKey,
}: {
  appUserId: string;
  plusEntitlementId: string;
  revenueCatSecretApiKey: string;
}): Promise<"free" | "plus"> {
  const response = await fetch(
    `${REVENUECAT_CUSTOMERS_BASE_URL}/${encodeURIComponent(appUserId)}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${revenueCatSecretApiKey}`,
      },
      method: "GET",
    },
  );

  if (!response.ok) {
    throw new Error(`RevenueCat subscriber lookup failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as RevenueCatSubscriberResponse;
  const plusEntitlement = payload.subscriber?.entitlements?.[plusEntitlementId];
  return isRevenueCatEntitlementActive(plusEntitlement)
    ? ACTIVE_SUBSCRIPTION_TIER
    : INACTIVE_SUBSCRIPTION_TIER;
}

function isRevenueCatEntitlementActive(entitlement?: RevenueCatEntitlement): boolean {
  if (!entitlement) {
    return false;
  }

  if (!entitlement.expires_date) {
    return true;
  }

  return Date.parse(entitlement.expires_date) > Date.now();
}

function readBearerToken(authorizationHeader: string | null): string | null {
  const prefix = "Bearer ";
  if (!authorizationHeader?.startsWith(prefix)) {
    return null;
  }

  return authorizationHeader.slice(prefix.length).trim() || null;
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
