import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { handleSyncRevenueCatSubscriptionRequest } from "./syncRevenueCatSubscriptionHandler.ts";

import { resolveSupabaseAdminKey } from "../_shared/supabaseAdminKey.ts";

const env = {
  plusEntitlementId: Deno.env.get("REVENUECAT_PLUS_ENTITLEMENT_ID") ?? "plus",
  revenueCatSecretApiKey: Deno.env.get("REVENUECAT_SECRET_API_KEY") ?? "",
  serviceRoleKey: resolveSupabaseAdminKey((name) => Deno.env.get(name)),
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
