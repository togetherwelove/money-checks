import type { Session } from "@supabase/supabase-js";

export type AuthProvider = "apple" | "email" | "google";

const AUTH_PROVIDER_LABELS = {
  apple: "Apple",
  email: "이메일",
  google: "Google",
  unknown: "알 수 없음",
} as const;

function normalizeAuthProvider(provider: string | null | undefined): AuthProvider | null {
  if (provider === "apple" || provider === "email" || provider === "google") {
    return provider;
  }

  return null;
}

export function resolveSessionAuthProvider(session: Session): AuthProvider | null {
  const appProvider = normalizeAuthProvider(session.user.app_metadata.provider);

  if (appProvider) {
    return appProvider;
  }

  for (const identity of session.user.identities ?? []) {
    const identityProvider = normalizeAuthProvider(identity.provider);
    if (identityProvider) {
      return identityProvider;
    }
  }

  return null;
}

export function resolveSessionAuthProviderLabel(session: Session) {
  const authProvider = resolveSessionAuthProvider(session);

  if (authProvider) {
    return AUTH_PROVIDER_LABELS[authProvider];
  }

  return AUTH_PROVIDER_LABELS.unknown;
}
