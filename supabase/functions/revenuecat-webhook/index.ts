import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { handleRevenueCatWebhookRequest } from "./revenueCatWebhookHandler.ts";

const env = {
  plusEntitlementId: Deno.env.get("REVENUECAT_PLUS_ENTITLEMENT_ID") ?? "plus",
  serviceRoleKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  supabaseUrl: Deno.env.get("SUPABASE_URL") ?? "",
  webhookAuthorization: Deno.env.get("REVENUECAT_WEBHOOK_AUTHORIZATION") ?? "",
};

Deno.serve(async (request) => {
  return handleRevenueCatWebhookRequest(request, {
    createAdminClient: () =>
      createClient(env.supabaseUrl, env.serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }),
    plusEntitlementId: env.plusEntitlementId,
    serviceRoleKey: env.serviceRoleKey,
    supabaseUrl: env.supabaseUrl,
    webhookAuthorization: env.webhookAuthorization,
  });
});
