import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

import { AuthRedirectConfig } from "../../constants/authRedirect";
import { GoogleAuthCopy } from "../../constants/googleAuth";
import { supabase } from "../supabase";
import { resolveGoogleAuthSession } from "./googleAuthSession";

WebBrowser.maybeCompleteAuthSession();

function resolveGoogleRedirectUri() {
  return makeRedirectUri({
    scheme: AuthRedirectConfig.appScheme,
    path: AuthRedirectConfig.googleCallbackPath,
  });
}

export function canUseGoogleSignIn(): boolean {
  return true;
}

export async function signInWithGoogle(): Promise<void> {
  const redirectUri = resolveGoogleRedirectUri();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: AuthRedirectConfig.googleProvider,
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
