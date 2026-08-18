import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { handleSendPushNotificationsRequest } from "./sendPushNotificationsHandler.ts";

const env = {
  serviceRoleKey: Deno.env.get("SUPABASE_SECRET_KEYS") ?? "",
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
