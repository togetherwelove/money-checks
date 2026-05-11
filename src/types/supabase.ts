export type LedgerEntryRow = {
  book_id: string;
  id: string;
  user_id: string;
  source_type: string;
  entry_type: "income" | "expense";
  occurred_on: string;
  amount: number;
  currency: string;
  content: string;
  category: string;
  category_id: string;
  installment_group_id: string | null;
  installment_months: number | null;
  installment_order: number | null;
  note: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type LedgerEntryAttachmentRow = {
  created_at: string;
  id: string;
  installment_group_id: string | null;
  ledger_entry_id: string | null;
  receipt_file_id: string;
  user_id: string;
};

export type LedgerDayNoteRow = {
  book_id: string;
  created_at: string;
  id: string;
  note: string;
  occurred_on: string;
  updated_at: string;
  user_id: string;
};

export type LedgerBookRow = {
  id: string;
  name: string;
  owner_id: string;
  share_code: string;
};

export type AccessibleLedgerBookRow = LedgerBookRow & {
  member_role: "editor" | "owner" | "viewer";
};

export type LedgerBookMemberRow = {
  book_id: string;
  role: "editor" | "owner" | "viewer";
  user_id: string;
};

export type LedgerBookMemberProfileRow = {
  display_name: string | null;
  role: "editor" | "owner" | "viewer";
  user_id: string;
};

export type LedgerBookJoinRequestRow = {
  book_id: string;
  created_at: string;
  id: string;
  join_resolution: "merge_personal_book_on_approval" | "standard";
  requester_user_id: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  status: "approved" | "pending" | "rejected";
};

export type LedgerBookJoinRequestProfileRow = {
  approval_status:
    | "blocked_accessible_limit"
    | "blocked_shared_editor_free"
    | "blocked_shared_owner_free"
    | "blocked_target_member_limit"
    | "can_approve"
    | "can_approve_with_personal_book_merge"
    | "needs_personal_book_merge_confirmation";
  created_at: string;
  display_name: string | null;
  id: string;
  join_resolution: "merge_personal_book_on_approval" | "standard";
  requester_user_id: string;
};

export type LedgerBookJoinPreviewRow = {
  status:
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
  target_book_id: string | null;
  target_book_name: string | null;
};

export type NotificationPreferencesRow = {
  enabled_by_event: Record<string, boolean> | null;
  enabled_thresholds: Record<string, boolean> | null;
  last_monthly_summary_sent_month: string | null;
  summary_timezone: string | null;
  threshold_periods: Record<string, string> | null;
  thresholds: Record<string, number> | null;
  user_id: string;
};

export type ProfileRow = {
  active_book_id: string | null;
  subscription_tier: "free" | "plus" | null;
};

export type ProfileDisplayRow = {
  display_name: string;
  id: string;
};

export type ProfileCurrencyRow = {
  default_currency: string;
  id: string;
};

export type ProfileSubscriptionRow = {
  id: string;
  subscription_tier: "free" | "plus" | null;
};

export type PushDeviceTokenRow = {
  expo_push_token: string;
  platform: "android" | "ios";
  updated_at: string;
  user_id: string;
};

export type ReceiptFileRow = {
  content_type: string;
  created_at: string;
  id: string;
  original_filename: string;
  storage_bucket: string;
  storage_path: string;
  user_id: string;
};
