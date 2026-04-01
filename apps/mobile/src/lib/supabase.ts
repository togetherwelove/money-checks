import "react-native-url-polyfill/auto";

import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

import { authStorage } from "./supabaseStorage";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
    storage: authStorage,
  },
});
