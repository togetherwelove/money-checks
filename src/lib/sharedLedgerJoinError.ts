import { AppMessages } from "../constants/messages";
import { ShareLedgerMessages } from "../constants/shareLedgerMessages";
import { SharedLedgerJoinPreviewCopy } from "../constants/sharedLedgerJoinPreview";

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

  if (
    errorText.includes("Join request was invoked too recently.") ||
    errorText.includes("Join preview was invoked too recently.")
  ) {
    return ShareLedgerMessages.joinCooldownError;
  }

  if (errorText.includes("Ledger book not found for code")) {
    return ShareLedgerMessages.joinInvalidCodeError;
  }

  if (errorText.includes("Shared ledger member limit reached for owner subscription tier.")) {
    return SharedLedgerJoinPreviewCopy.targetMemberLimit;
  }

  if (errorText.includes("Free shared ledger owners cannot join another ledger.")) {
    return ShareLedgerMessages.joinSharedOwnerFreeBlockedError;
  }

  if (errorText.includes("Free shared ledger editors cannot join another ledger.")) {
    return ShareLedgerMessages.joinSharedEditorFreeBlockedError;
  }

  if (errorText.includes("Join request requires personal ledger merge confirmation.")) {
    return ShareLedgerMessages.joinRequiresPersonalLedgerMergeConfirmationError;
  }

  if (errorText.includes("Accessible ledger book limit reached for subscription tier.")) {
    return ShareLedgerMessages.joinAccessibleLimitError;
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
