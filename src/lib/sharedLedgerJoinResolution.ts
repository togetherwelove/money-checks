import type {
  JoinSharedLedgerBookPreviewStatus,
  JoinSharedLedgerBookResolution,
} from "../types/ledgerBookJoinRequest";
import { JoinSharedLedgerBookResolutions } from "../types/ledgerBookJoinRequest";

export type JoinPreviewConfirmationKind = "discard" | "none" | "standard";

export function resolveJoinPreviewConfirmationKind(
  status: JoinSharedLedgerBookPreviewStatus,
): JoinPreviewConfirmationKind {
  if (status === "can_request_with_personal_book_discard") {
    return "discard";
  }

  if (status === "can_request") {
    return "standard";
  }

  if (status === "own_book" || status === "already_member") {
    return "none";
  }

  return "none";
}

export function resolveJoinResolutionAfterConfirmation(
  status: JoinSharedLedgerBookPreviewStatus,
  didConfirm: boolean,
): JoinSharedLedgerBookResolution | null {
  if (status === "own_book" || status === "already_member") {
    return JoinSharedLedgerBookResolutions.standard;
  }

  if (!didConfirm) {
    return null;
  }

  if (status === "can_request") {
    return JoinSharedLedgerBookResolutions.standard;
  }

  if (status === "can_request_with_personal_book_discard") {
    return JoinSharedLedgerBookResolutions.discardPersonalBookOnApproval;
  }

  return null;
}
