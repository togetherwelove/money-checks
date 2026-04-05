import { AppMessages } from "../constants/messages";
import { ShareLedgerMessages } from "../constants/shareLedgerMessages";

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

  if (errorText.includes("Active shared ledger editors cannot request another shared ledger.")) {
    return ShareLedgerMessages.joinSharedMemberBlockedError;
  }

  if (errorText.includes("Ledger book not found for code")) {
    return ShareLedgerMessages.joinInvalidCodeError;
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
