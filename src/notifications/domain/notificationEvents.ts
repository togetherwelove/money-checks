import type { LedgerEntryType } from "../../types/ledger";

export type NotificationPreferenceGroupId = "sharedLedger" | "threshold";

export type NotificationThresholdKey =
  | "expenseAmountDay"
  | "expenseAmountWeek"
  | "expenseAmountMonth";
export type NotificationThresholdPeriod = "day" | "week" | "month";

export type NotificationEventType =
  | "expense_limit_exceeded"
  | "member_left_book"
  | "member_joined_book"
  | "member_removed_from_book"
  | "other_member_created_entry"
  | "other_member_deleted_entry"
  | "other_member_updated_entry";

export type NotificationEvent = {
  type: NotificationEventType;
  actorName?: string;
  amount?: number;
  bookName?: string;
  category?: string;
  date?: string;
  entryType?: LedgerEntryType;
  note?: string;
  period?: NotificationThresholdPeriod;
  targetName?: string;
  thresholdAmount?: number;
  totalAmount?: number;
};
