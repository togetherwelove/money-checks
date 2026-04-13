import { AuthRedirectConfig } from "../../constants/authRedirect";
import { supabase } from "../supabase";

export function canUseGoogleSignIn(): boolean {
  return true;
}

export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: AuthRedirectConfig.googleProvider,
  });

  if (error) {
    throw error;
  }
}
