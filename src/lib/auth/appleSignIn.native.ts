import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";

import { AppleAuthConfig, AppleAuthCopy } from "../../constants/appleAuth";
import { appPlatform } from "../appPlatform";
import { syncOwnProfileDisplayNameIfMissing } from "../profiles";
import { supabase } from "../supabase";
import { resolveAppleDisplayName } from "./appleDisplayName";

const APPLE_AUTH_PROVIDER = "apple";
const APPLE_SIGN_IN_CANCELLED_CODE = "ERR_REQUEST_CANCELED";
const APPLE_SIGN_IN_UNKNOWN_CODE = "ERR_REQUEST_UNKNOWN";
const APPLE_SIGN_IN_UNKNOWN_MESSAGE = "The authorization attempt failed for an unknown reason";

async function createAppleNoncePair() {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

  return {
    hashedNonce,
    rawNonce,
  };
}

async function persistAppleDisplayName(
  userId: string | null | undefined,
  credential: AppleAuthentication.AppleAuthenticationCredential,
) {
  const appleDisplayName = resolveAppleDisplayName(credential);
  if (!appleDisplayName) {
    if (userId) {
      try {
        await syncOwnProfileDisplayNameIfMissing(userId, AppleAuthConfig.defaultDisplayName);
      } catch (profileError) {
        console.error("[appleSignIn] Failed to sync Apple default display name", profileError);
      }
    }
    return;
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      family_name: appleDisplayName.familyName,
      full_name: appleDisplayName.fullName,
      given_name: appleDisplayName.givenName,
      name: appleDisplayName.fullName,
    },
  });

  if (error) {
    console.error("[appleSignIn] Failed to persist Apple display name", error);
  }

  if (!userId) {
    return;
  }

  try {
    await syncOwnProfileDisplayNameIfMissing(userId, appleDisplayName.fullName);
  } catch (profileError) {
    console.error("[appleSignIn] Failed to sync Apple display name to profile", profileError);
  }
}

export function canUseAppleSignIn(): boolean {
  return appPlatform.isIOS;
}

export function isAppleSignInCancelled(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const errorWithCode = error as { code?: unknown; message?: unknown };
  return (
    errorWithCode.code === APPLE_SIGN_IN_CANCELLED_CODE ||
    errorWithCode.code === APPLE_SIGN_IN_UNKNOWN_CODE ||
    errorWithCode.message === "The user canceled the authorization attempt" ||
    errorWithCode.message === APPLE_SIGN_IN_UNKNOWN_MESSAGE
  );
}

export async function signInWithApple(): Promise<void> {
  if (!canUseAppleSignIn()) {
    throw new Error(AppleAuthCopy.unavailableError);
  }

  const { hashedNonce, rawNonce } = await createAppleNoncePair();
  const credential = await AppleAuthentication.signInAsync({
    nonce: hashedNonce,
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new Error(AppleAuthCopy.missingTokenError);
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    nonce: rawNonce,
    provider: APPLE_AUTH_PROVIDER,
    token: credential.identityToken,
  });

  if (error) {
    throw error;
  }

  await persistAppleDisplayName(data.user?.id, credential);
}
