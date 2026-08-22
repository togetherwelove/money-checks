import { AppLinks } from "../../constants/appLinks";
import { EmailAuthCopy } from "../../constants/emailAuth";
import { supabase } from "../supabase";
import { normalizeEmail } from "./emailPasswordAuth";
import { resolveGoogleAuthSession } from "./googleAuthSession";

const PASSWORD_RESET_RECOVERY_TYPE = "recovery";
const PASSWORD_RESET_REDIRECT_URLS = [
  new URL(AppLinks.passwordResetUrl),
  new URL(AppLinks.legacyPasswordResetUrl),
] as const;

let lastCompletedPasswordRecoveryUrl: string | null = null;

export function resolvePasswordResetRedirectUri(): string {
  return AppLinks.passwordResetUrl;
}

export function isPasswordRecoveryRedirectUrl(redirectUrl: string): boolean {
  try {
    const parsedRedirectUrl = new URL(redirectUrl);
    const urlType = readUrlParam(parsedRedirectUrl, "type");

    return urlType === PASSWORD_RESET_RECOVERY_TYPE && isKnownPasswordResetUrl(parsedRedirectUrl);
  } catch {
    return false;
  }
}

export async function requestEmailPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(normalizeEmail(email), {
    redirectTo: resolvePasswordResetRedirectUri(),
  });

  if (error) {
    throw error;
  }
}

export async function completePasswordRecoveryRedirect(redirectUrl: string): Promise<void> {
  if (!isPasswordRecoveryRedirectUrl(redirectUrl)) {
    return;
  }

  if (lastCompletedPasswordRecoveryUrl === redirectUrl) {
    return;
  }

  const recoverySession = resolveGoogleAuthSession(redirectUrl);
  const { error } = await supabase.auth.setSession({
    access_token: recoverySession.accessToken,
    refresh_token: recoverySession.refreshToken,
  });

  if (error) {
    throw error;
  }

  lastCompletedPasswordRecoveryUrl = redirectUrl;
}

export async function updateEmailPassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw error;
  }
}

function readUrlParam(url: URL, key: string): string | null {
  const searchValue = url.searchParams.get(key);
  if (searchValue) {
    return searchValue;
  }

  return new URLSearchParams(url.hash.replace(/^#/, "")).get(key);
}

function isKnownPasswordResetUrl(parsedRedirectUrl: URL): boolean {
  return PASSWORD_RESET_REDIRECT_URLS.some((knownUrl) => {
    return (
      parsedRedirectUrl.protocol === knownUrl.protocol &&
      parsedRedirectUrl.host === knownUrl.host &&
      parsedRedirectUrl.pathname === knownUrl.pathname
    );
  });
}

export function resolvePasswordResetErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return EmailAuthCopy.passwordReset.errorFallback;
}
