const profileDisplayNameCache = new Map<string, string>();

export function getCachedProfileDisplayName(userId: string): string | null {
  return profileDisplayNameCache.get(userId) ?? null;
}

export function setCachedProfileDisplayName(userId: string, displayName: string) {
  profileDisplayNameCache.set(userId, displayName);
}
