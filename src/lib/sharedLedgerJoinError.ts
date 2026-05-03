import { AppMessages } from "../constants/messages";
import { ShareLedgerMessages } from "../constants/shareLedgerMessages";
import { SubscriptionMessages } from "../constants/subscription";

type SupabaseLikeError = {
  details?: string | null;
  hint?: string | null;
  message?: string | null;
};

export function resolveSharedLedgerJoinErrorMessage(error: unknown): string {
  const errorText = extractErrorText(error);

  if (errorText.includes("This share code has expired.")) {
    return ShareLedgerMessages.joinExpiredCodeError;
  }

  if (errorText.includes("A join request is already pending.")) {
    return ShareLedgerMessages.joinPendingRequestError;
  }

  if (errorText.includes("This join request is cooling down.")) {
    return ShareLedgerMessages.joinCooldownError;
  }

  if (errorText.includes("Ledger book not found for code")) {
    return ShareLedgerMessages.joinInvalidCodeError;
  }

  if (errorText.includes("Shared ledger member limit reached for owner subscription tier.")) {
    return SubscriptionMessages.sharedLedgerLimitDescription;
  }

  return AppMessages.accountJoinError;
}

function extractErrorText(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "";
  }

  const { details, hint, message } = error as SupabaseLikeError;
  return [message, details, hint].filter(Boolean).join(" ");
}
