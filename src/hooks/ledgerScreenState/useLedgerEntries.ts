import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { DEFAULT_MEMBER_DISPLAY_NAME } from "../../constants/ledgerDisplay";
import { LedgerRealtimeConfig } from "../../constants/ledgerQueries";
import { AppMessages } from "../../constants/messages";
import { resolveLedgerEntryTargetMemberId } from "../../lib/ledgerEntryMetadata";
import {
  type LedgerEntryRealtimePayload,
  resolveChangedLedgerEntryRow,
  resolveDeletedLedgerEntryId,
  subscribeToLedgerEntryChanges,
} from "../../lib/ledgerEntryRealtime";
import { logAppError } from "../../lib/logAppError";
import { createPerformanceTrace } from "../../lib/performanceTrace";
import { fetchProfileDisplayName } from "../../lib/profiles";
import type { LedgerEntry } from "../../types/ledger";
import { getMonthKey } from "../../utils/calendar";
import { mapLedgerEntryRow } from "../../utils/ledgerMapper";
import { loadLedgerMonthsEntries } from "./helpers";
import {
  type LedgerEntryCache,
  getCalendarBackgroundPreloadMonths,
  getCalendarPagePreloadMonths,
  getVisibleWindowEntries,
  getVisibleWindowMonths,
  hasCachedMonth,
  removeEntryFromCache,
  replaceVisibleWindowEntries,
  setMonthEntriesInCache,
  upsertEntryInCachedMonth,
} from "./ledgerEntryCache";

type LedgerEntriesState = {
  entryCache: LedgerEntryCache;
  entries: LedgerEntry[];
  entriesError: string | null;
  isLoadingEntries: boolean;
  isRefreshing: boolean;
  refreshLedger: () => Promise<void>;
  setEntries: Dispatch<SetStateAction<LedgerEntry[]>>;
};

export function useLedgerEntries(
  activeBookId: string | null,
  visibleMonth: Date,
): LedgerEntriesState {
  const [entryCache, setEntryCache] = useState<LedgerEntryCache>({});
  const [entriesError, setEntriesError] = useState<string | null>(null);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const cachedBookIdRef = useRef<string | null>(activeBookId);
  const refreshMonths = useMemo(() => getVisibleWindowMonths(visibleMonth), [visibleMonth]);
  const pagePreloadMonths = useMemo(
    () => getCalendarPagePreloadMonths(visibleMonth),
    [visibleMonth],
  );
  const backgroundPreloadMonths = useMemo(
    () => getCalendarBackgroundPreloadMonths(visibleMonth),
    [visibleMonth],
  );
  const missingPagePreloadMonths = useMemo(
    () => pagePreloadMonths.filter((month) => !hasCachedMonth(entryCache, month)),
    [entryCache, pagePreloadMonths],
  );
  const missingBackgroundPreloadMonths = useMemo(
    () => backgroundPreloadMonths.filter((month) => !hasCachedMonth(entryCache, month)),
    [backgroundPreloadMonths, entryCache],
  );
  const hasVisibleMonthCached = useMemo(
    () => hasCachedMonth(entryCache, visibleMonth),
    [entryCache, visibleMonth],
  );
  const entries = useMemo(
    () => getVisibleWindowEntries(entryCache, visibleMonth),
    [entryCache, visibleMonth],
  );

  useEffect(() => {
    const activeBookChanged = cachedBookIdRef.current !== activeBookId;
    if (!activeBookChanged) {
      return;
    }

    cachedBookIdRef.current = activeBookId;
    setEntryCache({});
    setEntriesError(null);
    setIsLoadingEntries(false);
  }, [activeBookId]);

  useEffect(() => {
    let isMounted = true;
    if (!activeBookId) {
      setIsLoadingEntries(false);
      return () => {
        isMounted = false;
      };
    }

    if (missingPagePreloadMonths.length === 0 && missingBackgroundPreloadMonths.length === 0) {
      setIsLoadingEntries(false);
      return () => {
        isMounted = false;
      };
    }

    if (!hasVisibleMonthCached) {
      setIsLoadingEntries(true);
    }
    setEntriesError(null);

    const loadMonthsIntoCache = async (months: Date[]) => {
      if (months.length === 0) {
        return;
      }

      const trace = createPerformanceTrace("LedgerEntries", {
        monthCount: months.length,
        step: "load_month_group",
      });
      const nextEntriesByMonth = await loadLedgerMonthsEntries(activeBookId, months);
      trace("loaded_month_group", { entryCount: countLedgerEntriesByMonth(nextEntriesByMonth) });
      if (!isMounted) {
        return;
      }

      setEntryCache((currentCache) =>
        months.reduce((nextCache, month) => {
          const monthKey = getMonthKey(month);
          return setMonthEntriesInCache(nextCache, month, nextEntriesByMonth[monthKey] ?? []);
        }, currentCache),
      );
    };

    const loadPreloadMonths = async (months: Date[]) => {
      try {
        await loadMonthsIntoCache(months);
      } catch (error) {
        logAppError("LedgerEntries", error, {
          activeBookId,
          step: "preload_entries",
          visibleMonth: visibleMonth.toISOString(),
        });
      }
    };

    const loadEntriesIntoCache = async () => {
      const visibleMonthKey = getMonthKey(visibleMonth);
      const missingVisibleMonth = missingPagePreloadMonths.some(
        (month) => getMonthKey(month) === visibleMonthKey,
      );
      const missingAdjacentPageMonths = missingPagePreloadMonths.filter(
        (month) => getMonthKey(month) !== visibleMonthKey,
      );

      if (missingVisibleMonth) {
        await loadMonthsIntoCache([visibleMonth]);
        if (!isMounted) {
          return;
        }
        setIsLoadingEntries(false);
        await loadPreloadMonths(missingAdjacentPageMonths);
      } else {
        setIsLoadingEntries(false);
        await loadPreloadMonths(missingPagePreloadMonths);
      }

      await loadPreloadMonths(missingBackgroundPreloadMonths);
    };

    void loadEntriesIntoCache()
      .catch((error) => {
        logAppError("LedgerEntries", error, {
          activeBookId,
          step: "load_entries",
          visibleMonth: visibleMonth.toISOString(),
        });
        if (isMounted) {
          setEntriesError(AppMessages.ledgerError);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingEntries(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [
    activeBookId,
    hasVisibleMonthCached,
    missingBackgroundPreloadMonths,
    missingPagePreloadMonths,
    visibleMonth,
  ]);

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

        setEntryCache((currentCache) => removeEntryFromCache(currentCache, deletedEntryId));
        return;
      }

      const changedRow = resolveChangedLedgerEntryRow(payload);
      let authorName = DEFAULT_MEMBER_DISPLAY_NAME;
      let targetMemberName = DEFAULT_MEMBER_DISPLAY_NAME;
      try {
        authorName =
          (await fetchProfileDisplayName(changedRow.user_id)).trim() || DEFAULT_MEMBER_DISPLAY_NAME;
      } catch (error) {
        logAppError("LedgerEntries", error, {
          authorUserId: changedRow.user_id,
          entryId: changedRow.id,
          step: "load_entry_author_name",
        });
      }
      try {
        targetMemberName =
          (await fetchProfileDisplayName(resolveLedgerEntryTargetMemberId(changedRow))).trim() ||
          DEFAULT_MEMBER_DISPLAY_NAME;
      } catch (error) {
        logAppError("LedgerEntries", error, {
          entryId: changedRow.id,
          step: "load_entry_target_member_name",
          targetMemberUserId: resolveLedgerEntryTargetMemberId(changedRow),
        });
      }

      setEntryCache((currentCache) => {
        const currentEntry = Object.values(currentCache)
          .flat()
          .find((entry) => entry.id === changedRow.id);
        const nextEntry = mapLedgerEntryRow(
          changedRow,
          currentEntry?.authorId === changedRow.user_id
            ? (currentEntry.authorName ?? authorName)
            : authorName,
        );
        return upsertEntryInCachedMonth(removeEntryFromCache(currentCache, changedRow.id), {
          ...nextEntry,
          authorHasBookAccess: currentEntry?.authorHasBookAccess ?? true,
          targetMemberHasBookAccess: currentEntry?.targetMemberHasBookAccess ?? true,
          targetMemberName,
        });
      });
    };

    return subscribeToLedgerEntryChanges({
      bookId: activeBookId,
      channelScope: LedgerRealtimeConfig.calendarChannelScope,
      onChange: (payload) => {
        void handleLedgerEntryChange(payload);
      },
    });
  }, [activeBookId]);

  const refreshLedger = async () => {
    if (!activeBookId) {
      return;
    }

    setIsRefreshing(true);
    setEntriesError(null);

    try {
      const trace = createPerformanceTrace("LedgerEntries", {
        monthCount: refreshMonths.length,
        step: "refresh_visible_window_entries",
      });
      const nextEntriesByMonth = await loadLedgerMonthsEntries(activeBookId, refreshMonths);
      trace("refreshed_visible_window_entries", {
        entryCount: countLedgerEntriesByMonth(nextEntriesByMonth),
      });
      setEntryCache((currentCache) => {
        const nextCache = { ...currentCache };
        for (const month of refreshMonths) {
          delete nextCache[getMonthKey(month)];
        }
        return refreshMonths.reduce((updatedCache, month) => {
          const monthKey = getMonthKey(month);
          return setMonthEntriesInCache(updatedCache, month, nextEntriesByMonth[monthKey] ?? []);
        }, nextCache);
      });
    } catch (error) {
      logAppError("LedgerEntries", error, {
        activeBookId,
        step: "refresh_entries",
        visibleMonth: visibleMonth.toISOString(),
      });
      setEntriesError(AppMessages.ledgerError);
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    entryCache,
    entries,
    entriesError,
    isLoadingEntries,
    isRefreshing,
    refreshLedger,
    setEntries: (updater) =>
      setEntryCache((currentCache) => {
        const currentEntries = getVisibleWindowEntries(currentCache, visibleMonth);
        const nextEntries = typeof updater === "function" ? updater(currentEntries) : updater;
        return replaceVisibleWindowEntries(currentCache, visibleMonth, nextEntries);
      }),
  };
}

function countLedgerEntriesByMonth(entriesByMonth: Record<string, LedgerEntry[]>): number {
  return Object.values(entriesByMonth).reduce((count, entries) => count + entries.length, 0);
}
