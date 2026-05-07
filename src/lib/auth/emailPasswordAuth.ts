import { supabase } from "../supabase";

export type EmailPasswordSignUpResult = "otp-required" | "signed-in";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function signInWithEmailPassword(email: string, password: string): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  const { error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
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
