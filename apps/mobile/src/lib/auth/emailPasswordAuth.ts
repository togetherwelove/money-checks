import { supabase } from "../supabase";

export type EmailPasswordSignUpResult = "confirmation-required" | "signed-in";

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
): Promise<EmailPasswordSignUpResult> {
  const normalizedEmail = normalizeEmail(email);
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
  });

  if (error) {
    throw error;
  }

  return data.session ? "signed-in" : "confirmation-required";
}
