import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? "";
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";

export const hasPasswordRecoveryRedirect =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.hash.replace(/^#/, "")).get("type") === "recovery";

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error("Supabase public configuration is missing.");
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "implicit",
    persistSession: true,
  },
});
