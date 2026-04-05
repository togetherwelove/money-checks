const EMAIL_LIKE_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeDisplayNameCandidate(value: string | null | undefined): string {
  const trimmedValue = value?.trim() ?? "";
  if (!trimmedValue) {
    return "";
  }

  return EMAIL_LIKE_PATTERN.test(trimmedValue) ? "" : trimmedValue;
}

export function isValidDisplayName(value: string | null | undefined): boolean {
  return Boolean(normalizeDisplayNameCandidate(value));
}
