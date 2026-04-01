export function resolveFallbackDisplayName(
  userMetadata: Record<string, unknown> | undefined,
  email: string | undefined,
): string {
  return (
    getStringMetadata(userMetadata, "full_name") ??
    getStringMetadata(userMetadata, "name") ??
    getStringMetadata(userMetadata, "user_name") ??
    getStringMetadata(userMetadata, "preferred_username") ??
    email ??
    ""
  );
}

function getStringMetadata(
  userMetadata: Record<string, unknown> | undefined,
  key: string,
): string | null {
  const value = userMetadata?.[key];
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : null;
}
