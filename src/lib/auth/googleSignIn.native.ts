import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

import { GoogleAuthCopy } from "../../constants/googleAuth";
import { supabase } from "../supabase";
import {
  GOOGLE_AUTH_APP_SCHEME,
  GOOGLE_AUTH_CALLBACK_PATH,
  GOOGLE_AUTH_PROVIDER,
} from "./googleAuthConfig";
import { resolveGoogleAuthSession } from "./googleAuthSession";

WebBrowser.maybeCompleteAuthSession();

function resolveGoogleRedirectUri() {
  return makeRedirectUri({
    scheme: GOOGLE_AUTH_APP_SCHEME,
    path: GOOGLE_AUTH_CALLBACK_PATH,
  });
}

export function canUseGoogleSignIn(): boolean {
  return true;
}

export function isGoogleSignInCancelled(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const errorWithMessage = error as { message?: unknown };
  return errorWithMessage.message === GoogleAuthCopy.cancelledError;
}

export async function signInWithGoogle(): Promise<void> {
  const redirectUri = resolveGoogleRedirectUri();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: GOOGLE_AUTH_PROVIDER,
    options: {
      redirectTo: redirectUri,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    throw error;
  }

  const authSessionResult = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

  if (authSessionResult.type !== "success") {
    throw new Error(GoogleAuthCopy.cancelledError);
  }

  const googleAuthSession = resolveGoogleAuthSession(authSessionResult.url);
  const { error: sessionError } = await supabase.auth.setSession({
    access_token: googleAuthSession.accessToken,
    refresh_token: googleAuthSession.refreshToken,
  });

  if (sessionError) {
    throw sessionError;
  }
}
