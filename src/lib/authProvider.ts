import type { Session } from "@supabase/supabase-js";

const AUTH_PROVIDER_LABELS = {
  apple: "Apple",
  email: "이메일",
  google: "Google",
  unknown: "알 수 없음",
} as const;

function normalizeAuthProvider(provider: string | null | undefined) {
  if (provider === "apple" || provider === "email" || provider === "google") {
    return provider;
  }

  return null;
}

export function resolveSessionAuthProviderLabel(session: Session) {
  const appProvider = normalizeAuthProvider(session.user.app_metadata.provider);

  if (appProvider) {
    return AUTH_PROVIDER_LABELS[appProvider];
  }

  for (const identity of session.user.identities ?? []) {
    const identityProvider = normalizeAuthProvider(identity.provider);
    if (identityProvider) {
      return AUTH_PROVIDER_LABELS[identityProvider];
    }
  }

  return AUTH_PROVIDER_LABELS.unknown;
}
