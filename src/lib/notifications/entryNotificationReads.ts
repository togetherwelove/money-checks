import { NotificationBadgeKinds } from "../../constants/notificationBadges";
import { supabase } from "../supabase";

const MARK_ENTRY_NOTIFICATIONS_READ_FUNCTION = "mark_entry_notifications_read";

export async function markEntryNotificationsRead(
  bookId: string,
  entryIds: readonly string[],
): Promise<void> {
  const { error } = await supabase.rpc(MARK_ENTRY_NOTIFICATIONS_READ_FUNCTION, {
    target_book_id: bookId,
    target_entry_ids: entryIds,
  });
  if (error) throw error;
}

export function resolveEntryNotificationReadTarget(data: Record<string, unknown> | undefined) {
  if (
    data?.badgeKind !== NotificationBadgeKinds.ledgerEntry ||
    typeof data.badgeBookId !== "string" || !data.badgeBookId ||
    typeof data.badgeEntryId !== "string" || !data.badgeEntryId
  ) {
    return null;
  }
  return { bookId: data.badgeBookId, entryId: data.badgeEntryId };
}
