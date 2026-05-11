import { EmailAuthCopy } from "../../constants/emailAuth";
import { EmailSignInErrorCopy } from "../../constants/emailSignInErrors";
import { supabase } from "../supabase";

export type EmailPasswordSignUpResult = "otp-required" | "signed-in";

const EMAIL_NOT_CONFIRMED_ERROR_CODE = "email_not_confirmed";
const EMAIL_NOT_CONFIRMED_ERROR_TEXT = "email not confirmed";

type AuthErrorLike = {
  code?: string | null;
  message?: string | null;
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isEmailNotConfirmedSignInError(error: unknown): boolean {
  if (!isAuthErrorLike(error)) {
    return false;
  }

  return (
    error.code === EMAIL_NOT_CONFIRMED_ERROR_CODE ||
    error.message?.toLowerCase().includes(EMAIL_NOT_CONFIRMED_ERROR_TEXT) === true
  );
}

export function resolveEmailPasswordSignInErrorMessage(error: unknown): string {
  if (isEmailNotConfirmedSignInError(error)) {
    return EmailSignInErrorCopy.emailNotConfirmed;
  }

  return EmailAuthCopy.signIn.errorFallback;
}

export async function signInWithEmailPassword(
  email: string,
  password: string,
  captchaToken: string,
): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  const { error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    options: {
      captchaToken,
    },
    password,
  });

  if (error) {
    throw error;
  }
}

export async function signUpWithEmailPassword(
  email: string,
  password: string,
  captchaToken: string,
): Promise<EmailPasswordSignUpResult> {
  const normalizedEmail = normalizeEmail(email);
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    options: {
      captchaToken,
    },
    password,
  });

  if (error) {
    throw error;
  }

  return data.session ? "signed-in" : "otp-required";
}

export async function verifyEmailSignUpOtp(email: string, token: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({
    email: normalizeEmail(email),
    token: token.trim(),
    type: "email",
  });

  if (error) {
    throw error;
  }
}

export async function resendEmailSignUpOtp(email: string): Promise<void> {
  const { error } = await supabase.auth.resend({
    email: normalizeEmail(email),
    type: "signup",
  });

  if (error) {
    throw error;
  }
}

function isAuthErrorLike(error: unknown): error is AuthErrorLike {
  return typeof error === "object" && error !== null;
}
