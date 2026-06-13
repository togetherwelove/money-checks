import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  DEFAULT_MEMBER_DISPLAY_NAME,
  DELETED_MEMBER_DISPLAY_NAME,
} from "../../constants/ledgerDisplay";
import { LedgerQueryConfig, LedgerRealtimeConfig } from "../../constants/ledgerQueries";
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
  getChartTrendPreloadMonths,
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
  preloadChartEntries: () => Promise<void>;
  refreshLedger: () => Promise<void>;
  setEntries: Dispatch<SetStateAction<LedgerEntry[]>>;
};

export function useLedgerEntries(
  activeBookId: string | null,
  visibleMonth: Date,
): LedgerEntriesState {
  const [entryCacheByBookId, setEntryCacheByBookId] = useState<Record<string, LedgerEntryCache>>(
    {},
  );
  const [entriesError, setEntriesError] = useState<string | null>(null);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const cachedBookIdRef = useRef<string | null>(activeBookId);
  const scheduledBackgroundPreloadKeysRef = useRef<Set<string>>(new Set());
  const entryCache = activeBookId ? (entryCacheByBookId[activeBookId] ?? {}) : {};
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
  const loadMonthsIntoBookCache = useCallback(
    async (months: Date[], step: string) => {
      if (!activeBookId || months.length === 0) {
        return;
      }

      const trace = createPerformanceTrace("LedgerEntries", {
        monthCount: months.length,
        step,
      });
      const nextEntriesByMonth = await loadLedgerMonthsEntries(activeBookId, months);
      trace("loaded_month_group", { entryCount: countLedgerEntriesByMonth(nextEntriesByMonth) });
      setEntryCacheByBookId((currentCacheByBookId) =>
        updateBookEntryCache(currentCacheByBookId, activeBookId, (currentCache) =>
          months.reduce((nextCache, month) => {
            const monthKey = getMonthKey(month);
            return setMonthEntriesInCache(nextCache, month, nextEntriesByMonth[monthKey] ?? []);
          }, currentCache),
        ),
      );
    },
    [activeBookId],
  );
  const preloadChartEntries = useCallback(async () => {
    if (!activeBookId) {
      return;
    }

    const missingChartMonths = getChartTrendPreloadMonths(visibleMonth).filter(
      (month) => !hasCachedMonth(entryCache, month),
    );
    if (missingChartMonths.length === 0) {
      return;
    }

    try {
      await loadMonthsIntoBookCache(missingChartMonths, "preload_chart_entries");
    } catch (error) {
      logAppError("LedgerEntries", error, {
        activeBookId,
        step: "preload_chart_entries",
        visibleMonth: visibleMonth.toISOString(),
      });
      setEntriesError(AppMessages.ledgerError);
    }
  }, [activeBookId, entryCache, loadMonthsIntoBookCache, visibleMonth]);

  useEffect(() => {
    const activeBookChanged = cachedBookIdRef.current !== activeBookId;
    if (!activeBookChanged) {
      return;
    }

    cachedBookIdRef.current = activeBookId;
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

      setEntryCacheByBookId((currentCacheByBookId) =>
        updateBookEntryCache(currentCacheByBookId, activeBookId, (currentCache) =>
          months.reduce((nextCache, month) => {
            const monthKey = getMonthKey(month);
            return setMonthEntriesInCache(nextCache, month, nextEntriesByMonth[monthKey] ?? []);
          }, currentCache),
        ),
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

      const backgroundMonthsToPreload = missingBackgroundPreloadMonths.filter((month) => {
        const preloadKey = createBookMonthPreloadKey(activeBookId, month);
        if (scheduledBackgroundPreloadKeysRef.current.has(preloadKey)) {
          return false;
        }

        scheduledBackgroundPreloadKeysRef.current.add(preloadKey);
        return true;
      });
      if (backgroundMonthsToPreload.length === 0) {
        return;
      }

      await wait(LedgerQueryConfig.calendarBackgroundPreloadDelayMs);
      if (!isMounted) {
        for (const month of backgroundMonthsToPreload) {
          scheduledBackgroundPreloadKeysRef.current.delete(
            createBookMonthPreloadKey(activeBookId, month),
          );
        }
        return;
      }

      try {
        await loadPreloadMonths(backgroundMonthsToPreload);
      } finally {
        for (const month of backgroundMonthsToPreload) {
          scheduledBackgroundPreloadKeysRef.current.delete(
            createBookMonthPreloadKey(activeBookId, month),
          );
        }
      }
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
      setEntryCacheByBookId((currentCacheByBookId) =>
        updateBookEntryCache(currentCacheByBookId, activeBookId, (currentCache) => {
          const nextCache = { ...currentCache };
          for (const month of refreshMonths) {
            delete nextCache[getMonthKey(month)];
          }
          return refreshMonths.reduce((updatedCache, month) => {
            const monthKey = getMonthKey(month);
            return setMonthEntriesInCache(updatedCache, month, nextEntriesByMonth[monthKey] ?? []);
          }, nextCache);
        }),
      );
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
    preloadChartEntries,
    setEntries: (updater) =>
      setEntryCacheByBookId((currentCacheByBookId) => {
        if (!activeBookId) {
          return currentCacheByBookId;
        }

        const currentCache = currentCacheByBookId[activeBookId] ?? {};
        const currentEntries = getVisibleWindowEntries(currentCache, visibleMonth);
        const nextEntries = typeof updater === "function" ? updater(currentEntries) : updater;
        return {
          ...currentCacheByBookId,
          [activeBookId]: replaceVisibleWindowEntries(currentCache, visibleMonth, nextEntries),
        };
      }),
  };
}

function updateBookEntryCache(
  cacheByBookId: Record<string, LedgerEntryCache>,
  bookId: string,
  updateCache: (currentCache: LedgerEntryCache) => LedgerEntryCache,
): Record<string, LedgerEntryCache> {
  return {
    ...cacheByBookId,
    [bookId]: updateCache(cacheByBookId[bookId] ?? {}),
  };
}

function wait(durationMs: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, durationMs);
  });
}

function createBookMonthPreloadKey(bookId: string, month: Date) {
  return `${bookId}:${getMonthKey(month)}`;
}

function countLedgerEntriesByMonth(entriesByMonth: Record<string, LedgerEntry[]>): number {
  return Object.values(entriesByMonth).reduce((count, entries) => count + entries.length, 0);
}
