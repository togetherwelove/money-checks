import { buildPreviousMonthSummaryLines } from "../../lib/monthlyComparisonSummary";
import type { LedgerEntry, MonthlyInsights } from "../../types/ledger";
import type { NotificationEvent, NotificationThresholdPeriod } from "./notificationEvents";

type SharedBookContext = {
  actorName: string;
  bookName: string;
};

export function createOtherMemberCreatedEntryEvent(
  context: SharedBookContext,
  entry: LedgerEntry,
): NotificationEvent {
  return createSharedEntryEvent("other_member_created_entry", context, entry);
}

export function createOtherMemberUpdatedEntryEvent(
  context: SharedBookContext,
  entry: LedgerEntry,
): NotificationEvent {
  return createSharedEntryEvent("other_member_updated_entry", context, entry);
}

export function createOtherMemberDeletedEntryEvent(
  context: SharedBookContext,
  entry: LedgerEntry,
): NotificationEvent {
  return createSharedEntryEvent("other_member_deleted_entry", context, entry);
}

export function createMemberJoinedBookEvent(
  actorName: string,
  bookName: string,
): NotificationEvent {
  return { actorName, bookName, type: "member_joined_book" };
}

export function createMemberLeftBookEvent(actorName: string, bookName: string): NotificationEvent {
  return { actorName, bookName, type: "member_left_book" };
}

export function createMemberRemovedFromBookEvent(
  actorName: string,
  bookName: string,
): NotificationEvent {
  return { actorName, bookName, type: "member_removed_from_book" };
}

export function createExpenseLimitExceededEvent(
  period: NotificationThresholdPeriod,
  totalAmount: number,
  thresholdAmount: number,
): NotificationEvent {
  return {
    period,
    thresholdAmount,
    totalAmount,
    type: "expense_limit_exceeded",
  };
}

export function createMonthEndSummaryEvent(insights: MonthlyInsights): NotificationEvent {
  const summaryLines = buildPreviousMonthSummaryLines(insights);

  return {
    currentMonthLabel: insights.currentMonthLabel,
    expenseSummary: summaryLines.expenseSummary,
    incomeSummary: summaryLines.incomeSummary,
    type: "month_end_summary",
  };
}

function createSharedEntryEvent(
  type: NotificationEvent["type"],
  context: SharedBookContext,
  entry: LedgerEntry,
): NotificationEvent {
  return {
    actorName: context.actorName,
    amount: entry.amount,
    bookName: context.bookName,
    category: entry.category,
    date: entry.date,
    entryType: entry.type,
    note: entry.note,
    type,
  };
}
