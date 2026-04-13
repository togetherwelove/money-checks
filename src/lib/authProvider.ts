import type { Session } from "@supabase/supabase-js";

import { AuthProviderCopy } from "../constants/authProvider";

function normalizeAuthProvider(provider: string | null | undefined) {
  if (provider === "apple" || provider === "email" || provider === "google") {
    return provider;
  }

  return null;
}

export function resolveSessionAuthProviderLabel(session: Session) {
  const appProvider = normalizeAuthProvider(session.user.app_metadata.provider);

  if (appProvider) {
    return AuthProviderCopy[appProvider];
  }

  for (const identity of session.user.identities ?? []) {
    const identityProvider = normalizeAuthProvider(identity.provider);
    if (identityProvider) {
      return AuthProviderCopy[identityProvider];
    }
  }

  return AuthProviderCopy.unknown;
}
