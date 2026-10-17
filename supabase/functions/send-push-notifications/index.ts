import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { handleSendPushNotificationsRequest } from "./sendPushNotificationsHandler.ts";

import { resolveSupabaseAdminKey } from "../_shared/supabaseAdminKey.ts";

const env = {
  serviceRoleKey: resolveSupabaseAdminKey((name) => Deno.env.get(name)),
  supabaseUrl: Deno.env.get("SUPABASE_URL") ?? "",
};

Deno.serve(async (request) => {
  return handleSendPushNotificationsRequest(request, {
    createAdminClient: () =>
      createClient(env.supabaseUrl, env.serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }),
    serviceRoleKey: env.serviceRoleKey,
    supabaseUrl: env.supabaseUrl,
  });
});
