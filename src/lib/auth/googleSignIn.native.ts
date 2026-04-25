import { makeRedirectUri } from "expo-auth-session";
import { Linking } from "react-native";

import { GoogleAuthCopy } from "../../constants/googleAuth";
import { supabase } from "../supabase";
import {
  GOOGLE_AUTH_APP_SCHEME,
  GOOGLE_AUTH_CALLBACK_PATH,
  GOOGLE_AUTH_PROVIDER,
} from "./googleAuthConfig";
import { resolveGoogleAuthSession } from "./googleAuthSession";
let lastCompletedGoogleRedirectUrl: string | null = null;

function resolveGoogleRedirectUri() {
  return makeRedirectUri({
    scheme: GOOGLE_AUTH_APP_SCHEME,
    path: GOOGLE_AUTH_CALLBACK_PATH,
  });
}

function isMatchingGoogleRedirectUrl(redirectUrl: string) {
  const resolvedRedirectUrl = new URL(resolveGoogleRedirectUri());
  const parsedRedirectUrl = new URL(redirectUrl);

  return (
    parsedRedirectUrl.protocol === resolvedRedirectUrl.protocol &&
    parsedRedirectUrl.host === resolvedRedirectUrl.host &&
    parsedRedirectUrl.pathname === resolvedRedirectUrl.pathname
  );
}

export function canUseGoogleSignIn(): boolean {
  return true;
}

export function isGoogleSignInRedirectUrl(redirectUrl: string): boolean {
  try {
    return isMatchingGoogleRedirectUrl(redirectUrl);
  } catch {
    return false;
  }
}

export function isGoogleSignInCancelled(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const errorWithMessage = error as { message?: unknown };
  return errorWithMessage.message === GoogleAuthCopy.cancelledError;
}

export async function completeGoogleSignInRedirect(redirectUrl: string): Promise<void> {
  if (!isGoogleSignInRedirectUrl(redirectUrl)) {
    return;
  }

  if (lastCompletedGoogleRedirectUrl === redirectUrl) {
    return;
  }

  const googleAuthSession = resolveGoogleAuthSession(redirectUrl);
  const { error: sessionError } = await supabase.auth.setSession({
    access_token: googleAuthSession.accessToken,
    refresh_token: googleAuthSession.refreshToken,
  });

  if (sessionError) {
    throw sessionError;
  }

  lastCompletedGoogleRedirectUrl = redirectUrl;
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

  lastCompletedGoogleRedirectUrl = null;
  await Linking.openURL(data.url);
}
