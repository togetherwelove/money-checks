import type * as AppleAuthentication from "expo-apple-authentication";


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
  const fullName = [familyName, givenName, middleName].filter(Boolean).join("");

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
