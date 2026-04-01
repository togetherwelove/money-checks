import { supabase } from "../supabase";

const GOOGLE_OAUTH_PROVIDER = "google";
const GOOGLE_OAUTH_QUERY_PARAMS = {
  prompt: "select_account",
} as const;
const NATIVE_AUTH_REDIRECT = "moneychecks://auth/callback";

export async function signInWithGoogle(): Promise<void> {
  const redirectTo = typeof window !== "undefined" ? window.location.origin : NATIVE_AUTH_REDIRECT;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: GOOGLE_OAUTH_PROVIDER,
    options: {
      queryParams: GOOGLE_OAUTH_QUERY_PARAMS,
      redirectTo,
    },
  });

  if (error) {
    throw error;
  }
}

export async function signOutFromApp(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: "global" });

  if (error) {
    throw error;
  }
}
