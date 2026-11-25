import { useEffect, useState } from "react";
import {
  SubscriptionConfig,
  SubscriptionTiers,
  type SubscriptionTier,
} from "../constants/subscription";
import { fetchProfileSubscriptionTier } from "../lib/profiles";

const memberLimitForTier = (tier: SubscriptionTier) =>
  tier === SubscriptionTiers.plus
    ? SubscriptionConfig.plusSharedMemberLimit
    : SubscriptionConfig.freeSharedMemberLimit;

export function useLedgerBookMemberLimit(
  ownerId: string | undefined,
  currentUserId: string,
  subscriptionTier: SubscriptionTier,
  memberCount: number,
): number | null {
  const [ownerLimit, setOwnerLimit] = useState<{ ownerId: string; limit: number } | null>(null);
  useEffect(() => {
    if (!ownerId || ownerId === currentUserId) return;
    const controller = new AbortController();
    void fetchProfileSubscriptionTier(ownerId, controller.signal)
      .then((tier) => {
        if (!controller.signal.aborted) setOwnerLimit({ ownerId, limit: memberLimitForTier(tier) });
      })
      .catch(() => {
        if (!controller.signal.aborted) setOwnerLimit(null);
      });
    return () => controller.abort();
  }, [ownerId, currentUserId, memberCount]);
  if (ownerId === currentUserId) return memberLimitForTier(subscriptionTier);
  return ownerLimit?.ownerId === ownerId ? (ownerLimit?.limit ?? null) : null;
}
