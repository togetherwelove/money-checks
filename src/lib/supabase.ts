import "react-native-url-polyfill/auto";

import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

import { authStorage } from "./supabaseStorage";
import { supabaseFetchWithClockSkewRetry } from "./supabaseFetch";

export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
export const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: Platform.OS === "web",
    persistSession: true,
    detectSessionInUrl: false,
    storage: authStorage,
  },
  global: {
    fetch: supabaseFetchWithClockSkewRetry,
  },
});
