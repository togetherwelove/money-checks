import type * as AppleAuthentication from "expo-apple-authentication";

import { resolveStaticCopyLanguage } from "../../i18n/staticCopy";

type AppleNameParts = {
  familyName: string | null;
  fullName: string;
  givenName: string | null;
};

export function resolveAppleDisplayName(
  credential: AppleAuthentication.AppleAuthenticationCredential,
): AppleNameParts | null {
  const givenName = normalizeNamePart(credential.fullName?.givenName);
  const middleName = normalizeNamePart(credential.fullName?.middleName);
  const familyName = normalizeNamePart(credential.fullName?.familyName);
  const fullName =
    resolveStaticCopyLanguage() === "ko"
      ? [familyName, givenName, middleName].filter(Boolean).join("")
      : [givenName, middleName, familyName].filter(Boolean).join(" ");

  if (!fullName) {
    return null;
  }

  return {
    familyName,
    fullName,
    givenName,
  };
}

function normalizeNamePart(value: string | null | undefined): string | null {
  const trimmedValue = value?.trim() ?? "";
  return trimmedValue || null;
}
