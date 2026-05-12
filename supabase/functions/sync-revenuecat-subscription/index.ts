import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { handleSyncRevenueCatSubscriptionRequest } from "./syncRevenueCatSubscriptionHandler.ts";

const env = {
  plusEntitlementId: Deno.env.get("REVENUECAT_PLUS_ENTITLEMENT_ID") ?? "plus",
  revenueCatSecretApiKey: Deno.env.get("REVENUECAT_SECRET_API_KEY") ?? "",
  serviceRoleKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  supabaseUrl: Deno.env.get("SUPABASE_URL") ?? "",
};

Deno.serve(async (request) => {
  return handleSyncRevenueCatSubscriptionRequest(request, {
    createAdminClient: () =>
      createClient(env.supabaseUrl, env.serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }),
    plusEntitlementId: env.plusEntitlementId,
    revenueCatSecretApiKey: env.revenueCatSecretApiKey,
    serviceRoleKey: env.serviceRoleKey,
    supabaseUrl: env.supabaseUrl,
  });
});
