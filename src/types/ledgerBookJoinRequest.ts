import type { LedgerBook } from "./ledgerBook";

export const JoinSharedLedgerBookResolutions = {
  mergePersonalBookOnApproval: "merge_personal_book_on_approval",
  standard: "standard",
} as const;

export type JoinSharedLedgerBookResult = "joined" | "requested";

export type JoinSharedLedgerBookResolution =
  (typeof JoinSharedLedgerBookResolutions)[keyof typeof JoinSharedLedgerBookResolutions];

export type JoinSharedLedgerBookPreviewStatus =
  | "already_member"
  | "blocked_accessible_limit"
  | "blocked_shared_editor_free"
  | "blocked_shared_owner_free"
  | "blocked_target_member_limit"
  | "can_request"
  | "can_request_with_personal_book_merge"
  | "expired_code"
  | "invalid_code"
  | "join_cooldown"
  | "own_book"
  | "pending_request";

export type JoinSharedLedgerBookPreview = {
  status: JoinSharedLedgerBookPreviewStatus;
  targetBookId: string | null;
  targetBookName: string | null;
};

export type JoinSharedLedgerBookAttempt = {
  book: LedgerBook | null;
  errorMessage: string | null;
  result: JoinSharedLedgerBookResult | null;
};

export type LedgerBookJoinApprovalStatus =
  | "blocked_accessible_limit"
  | "blocked_shared_editor_free"
  | "blocked_shared_owner_free"
  | "blocked_target_member_limit"
  | "can_approve"
  | "can_approve_with_personal_book_merge"
  | "needs_personal_book_merge_confirmation";

export type LedgerBookJoinRequest = {
  approvalStatus: LedgerBookJoinApprovalStatus;
  id: string;
  joinResolution: JoinSharedLedgerBookResolution;
  requestedAt: string;
  requesterDisplayName: string;
  requesterUserId: string;
};
