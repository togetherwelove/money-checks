import { useEffect, type Dispatch, type RefObject, type SetStateAction } from "react";
import {
  DEFAULT_MEMBER_DISPLAY_NAME,
  DELETED_MEMBER_DISPLAY_NAME,
} from "../../constants/ledgerDisplay";
import { LedgerRealtimeConfig } from "../../constants/ledgerQueries";
import { resolveLedgerEntryTargetMemberId } from "../../lib/ledgerEntryMetadata";
import {
  type LedgerEntryRealtimePayload,
  resolveChangedLedgerEntryRow,
  resolveDeletedLedgerEntryId,
  subscribeToLedgerEntryChanges,
} from "../../lib/ledgerEntryRealtime";
import { logAppError } from "../../lib/logAppError";
import { fetchProfileDisplayName } from "../../lib/profiles";
import { mapLedgerEntryRow } from "../../utils/ledgerMapper";
import { updateBookEntryCache } from "./bookEntryCache";
import {
  removeEntryFromCache,
  upsertEntryInCachedMonth,
  type LedgerEntryCache,
} from "./ledgerEntryCache";

export function useLedgerEntryRealtimeCache(
  activeBookId: string | null,
  setEntryCacheByBookId: Dispatch<SetStateAction<Record<string, LedgerEntryCache>>>,
  refreshLedgerRef: RefObject<((invalidateCachedMonths?: boolean) => Promise<void>) | null>,
) {
  useEffect(() => {
    if (!activeBookId) {
      return;
    }

    const handleLedgerEntryChange = async (payload: LedgerEntryRealtimePayload) => {
      if (payload.eventType === "DELETE") {
        const deletedEntryId = resolveDeletedLedgerEntryId(payload);
        if (!deletedEntryId) {
          return;
        }

        setEntryCacheByBookId((currentCacheByBookId) =>
          updateBookEntryCache(currentCacheByBookId, activeBookId, (currentCache) =>
            removeEntryFromCache(currentCache, deletedEntryId),
          ),
        );
        return;
      }

      const changedRow = resolveChangedLedgerEntryRow(payload);
      const authorUserId = changedRow.user_id;
      const targetMemberUserId = resolveLedgerEntryTargetMemberId(changedRow);
      const authorName = await resolveRealtimeMemberDisplayName({
        entryId: changedRow.id,
        step: "load_entry_author_name",
        userId: authorUserId,
      });
      const targetMemberName = await resolveRealtimeMemberDisplayName({
        entryId: changedRow.id,
        step: "load_entry_target_member_name",
        userId: targetMemberUserId,
      });

      setEntryCacheByBookId((currentCacheByBookId) =>
        updateBookEntryCache(currentCacheByBookId, activeBookId, (currentCache) => {
          const currentEntry = Object.values(currentCache)
            .flat()
            .find((entry) => entry.id === changedRow.id);
          const nextEntry = mapLedgerEntryRow(
            changedRow,
            currentEntry?.authorId === authorUserId
              ? (currentEntry.authorName ?? authorName)
              : authorName,
          );
          return upsertEntryInCachedMonth(removeEntryFromCache(currentCache, changedRow.id), {
            ...nextEntry,
            authorHasBookAccess: authorUserId ? (currentEntry?.authorHasBookAccess ?? true) : false,
            targetMemberHasBookAccess: targetMemberUserId
              ? (currentEntry?.targetMemberHasBookAccess ?? true)
              : false,
            targetMemberName,
          });
        }),
      );
    };

    return subscribeToLedgerEntryChanges({
      bookId: activeBookId,
      channelScope: LedgerRealtimeConfig.calendarChannelScope,
      onResync: () => {
        void refreshLedgerRef.current?.(true);
      },
      onChange: (payload) => {
        void handleLedgerEntryChange(payload);
      },
    });
  }, [activeBookId]);

  async function resolveRealtimeMemberDisplayName({
    entryId,
    step,
    userId,
  }: {
    entryId: string;
    step: string;
    userId: string | null;
  }): Promise<string> {
    if (!userId) {
      return DELETED_MEMBER_DISPLAY_NAME;
    }

    try {
      return (await fetchProfileDisplayName(userId)).trim() || DEFAULT_MEMBER_DISPLAY_NAME;
    } catch (error) {
      logAppError("LedgerEntries", error, {
        entryId,
        step,
        userId,
      });
      return DEFAULT_MEMBER_DISPLAY_NAME;
    }
  }
}
