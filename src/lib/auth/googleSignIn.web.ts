import { supabase } from "../supabase";
import { GOOGLE_AUTH_PROVIDER } from "./googleAuthConfig";

export function canUseGoogleSignIn(): boolean {
  return true;
}

export function isGoogleSignInCancelled(_error: unknown): boolean {
  return false;
}

export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: GOOGLE_AUTH_PROVIDER,
  });

  if (error) {
    throw error;
  }
}
