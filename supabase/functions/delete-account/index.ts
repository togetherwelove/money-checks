import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { handleDeleteAccountRequest } from "./deleteAccountHandler.ts";

const env = {
  serviceRoleKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  supabaseUrl: Deno.env.get("SUPABASE_URL") ?? "",
};

Deno.serve(async (request) => {
  return handleDeleteAccountRequest(request, {
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
