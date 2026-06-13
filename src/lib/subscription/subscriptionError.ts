export function isSubscriptionPurchaseCancelled(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { userCancelled?: boolean };
  return candidate.userCancelled === true;
}
