import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { handleSendMonthlySummaryNotificationsRequest } from "./sendMonthlySummaryNotificationsHandler.ts";

const env = {
  cronSecret: Deno.env.get("MONTHLY_SUMMARY_CRON_SECRET") ?? "",
  serviceRoleKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  supabaseUrl: Deno.env.get("SUPABASE_URL") ?? "",
};

Deno.serve(async (request) => {
  return handleSendMonthlySummaryNotificationsRequest(request, {
    createAdminClient: () =>
      createClient(env.supabaseUrl, env.serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }),
    cronSecret: env.cronSecret,
  });
});
