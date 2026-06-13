import type { LedgerEntry } from "../../types/ledger";
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
    content: entry.content,
    date: entry.date,
    entryId: entry.id,
    entryType: entry.type,
    note: entry.note,
    type,
  };
}
