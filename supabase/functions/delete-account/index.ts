import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { handleDeleteAccountRequest } from "./deleteAccountHandler.ts";
import { revokeAppleAuthorization } from "./appleTokenRevocation.ts";

import { resolveSupabaseAdminKey } from "../_shared/supabaseAdminKey.ts";

const env = {
  serviceRoleKey: resolveSupabaseAdminKey((name) => Deno.env.get(name)),
  supabaseUrl: Deno.env.get("SUPABASE_URL") ?? "",
};

const appleConfig = {
  clientId: Deno.env.get("APPLE_CLIENT_ID") ?? "",
  teamId: Deno.env.get("APPLE_TEAM_ID") ?? "",
  keyId: Deno.env.get("APPLE_KEY_ID") ?? "",
  privateKey: Deno.env.get("APPLE_PRIVATE_KEY") ?? "",
};

Deno.serve(async (request) => {
  return handleDeleteAccountRequest(request, {
    revokeAppleAuthorization: (code, subject) => revokeAppleAuthorization(code, subject, appleConfig),
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
