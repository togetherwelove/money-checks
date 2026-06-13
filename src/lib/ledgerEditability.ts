import {
  SubscriptionConfig,
  type SubscriptionTier,
  SubscriptionTiers,
} from "../constants/subscription";
import type { AccessibleLedgerBook } from "../types/ledgerBook";

export function resolveAccessibleLedgerBookLimit(subscriptionTier: SubscriptionTier): number {
  return subscriptionTier === SubscriptionTiers.plus
    ? SubscriptionConfig.plusAccessibleLedgerBookLimit
    : SubscriptionConfig.freeAccessibleLedgerBookLimit;
}

export function isLedgerEditLimitExceeded(
  subscriptionTier: SubscriptionTier,
  accessibleLedgerBookCount: number,
): boolean {
  return accessibleLedgerBookCount > resolveAccessibleLedgerBookLimit(subscriptionTier);
}

export function isLedgerBookEditableWithinPlanLimit(
  subscriptionTier: SubscriptionTier,
  accessibleLedgerBooks: readonly AccessibleLedgerBook[],
  targetBookId: string | null | undefined,
): boolean {
  if (!targetBookId) {
    return false;
  }

  const targetBookIndex = accessibleLedgerBooks.findIndex((book) => book.id === targetBookId);
  if (targetBookIndex < 0) {
    return false;
  }

  return targetBookIndex < resolveAccessibleLedgerBookLimit(subscriptionTier);
}
