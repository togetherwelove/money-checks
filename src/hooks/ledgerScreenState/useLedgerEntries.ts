import { useLedgerEntryRealtimeCache } from "./useLedgerEntryRealtimeCache";
import {
  updateBookEntryCache,
  countLedgerEntriesByMonth,
  setMonthsEntriesInCache,
} from "./bookEntryCache";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LedgerQueryConfig } from "../../constants/ledgerQueries";
import { AppMessages } from "../../constants/messages";
import { logAppError } from "../../lib/logAppError";
import { createPerformanceTrace } from "../../lib/performanceTrace";
import type { LedgerEntry } from "../../types/ledger";
import { getMonthKey, parseIsoDate } from "../../utils/calendar";
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

const EMPTY_ENTRY_CACHE: LedgerEntryCache = Object.freeze({});

type LedgerEntriesState = {
  entryCache: LedgerEntryCache;
  entries: LedgerEntry[];
  entriesError: string | null;
  isLoadingEntries: boolean;
  isLoadingChartEntries: boolean;
  isRefreshing: boolean;
  preloadChartEntries: (chartMonth?: Date) => Promise<void>;
  refreshLedger: (invalidateCachedMonths?: boolean) => Promise<void>;
  removeEntriesFromCache: (entryIds: readonly string[]) => void;
  replaceInstallmentGroupInCache: (
    installmentGroupId: string,
    entries: readonly LedgerEntry[],
  ) => void;
  setEntries: Dispatch<SetStateAction<LedgerEntry[]>>;
};

export function useLedgerEntries(
  activeBookId: string | null,
  visibleMonth: Date,
  initialEntryBootstrap: {
    bookId: string;
    entries: LedgerEntry[];
    month: Date;
  } | null,
): LedgerEntriesState {
  const [entryCacheByBookId, setEntryCacheByBookId] = useState<Record<string, LedgerEntryCache>>(
    {},
  );
  const [entriesError, setEntriesError] = useState<string | null>(null);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [chartLoadingCount, setChartLoadingCount] = useState(0);
  const pendingChartRequestsRef = useRef(new Map<string, Promise<void>>());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const cachedBookIdRef = useRef<string | null>(activeBookId);
  const refreshLedgerRef = useRef<LedgerEntriesState["refreshLedger"] | null>(null);
  const cacheRevisionRef = useRef(0);
  const scheduledBackgroundPreloadKeysRef = useRef<Set<string>>(new Set());
  const entryCache = activeBookId
    ? (entryCacheByBookId[activeBookId] ?? EMPTY_ENTRY_CACHE)
    : EMPTY_ENTRY_CACHE;
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
  const hasPendingInitialBootstrap = Boolean(
    activeBookId &&
      initialEntryBootstrap?.bookId === activeBookId &&
      getMonthKey(initialEntryBootstrap.month) === getMonthKey(visibleMonth) &&
      !hasVisibleMonthCached,
  );

  useEffect(() => {
    if (!activeBookId || initialEntryBootstrap?.bookId !== activeBookId) {
      return;
    }

    setEntryCacheByBookId((currentCacheByBookId) =>
      updateBookEntryCache(currentCacheByBookId, activeBookId, (currentCache) =>
        hasCachedMonth(currentCache, initialEntryBootstrap.month)
          ? currentCache
          : setMonthEntriesInCache(
              currentCache,
              initialEntryBootstrap.month,
              initialEntryBootstrap.entries,
            ),
      ),
    );
  }, [activeBookId, initialEntryBootstrap]);
  const loadMonthsIntoBookCache = useCallback(
    async (months: Date[], step: string) => {
      if (!activeBookId || months.length === 0) {
        return;
      }

      const trace = createPerformanceTrace("LedgerEntries", {
        monthCount: months.length,
        step,
      });
      const revision = cacheRevisionRef.current;
      const nextEntriesByMonth = await loadLedgerMonthsEntries(activeBookId, months);
      if (revision !== cacheRevisionRef.current) return;
      trace("loaded_month_group", { entryCount: countLedgerEntriesByMonth(nextEntriesByMonth) });
      setEntryCacheByBookId((currentCacheByBookId) =>
        updateBookEntryCache(currentCacheByBookId, activeBookId, (currentCache) =>
          setMonthsEntriesInCache(currentCache, months, nextEntriesByMonth),
        ),
      );
    },
    [activeBookId],
  );
  const preloadChartEntries = useCallback(
    async (chartMonth = visibleMonth) => {
      if (!activeBookId) {
        return;
      }
      const requestKey = `${activeBookId}:${getMonthKey(chartMonth)}:${cacheRevisionRef.current}`;
      const pending = pendingChartRequestsRef.current.get(requestKey);
      if (pending) return pending;

      const missingChartMonths = getChartTrendPreloadMonths(chartMonth).filter(
        (month) => !hasCachedMonth(entryCache, month),
      );
      if (missingChartMonths.length === 0) {
        return;
      }

      setChartLoadingCount((count) => count + 1);
      const request = loadMonthsIntoBookCache(missingChartMonths, "preload_chart_entries")
        .catch((error) => {
          logAppError("LedgerEntries", error, {
            activeBookId,
            step: "preload_chart_entries",
            visibleMonth: chartMonth.toISOString(),
          });
          setEntriesError(AppMessages.ledgerError);
        })
        .finally(() => {
          setChartLoadingCount((count) => Math.max(0, count - 1));
          pendingChartRequestsRef.current.delete(requestKey);
        });
      pendingChartRequestsRef.current.set(requestKey, request);
      return request;
    },
    [activeBookId, entryCache, loadMonthsIntoBookCache, visibleMonth],
  );

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
    const revision = cacheRevisionRef.current;
    if (!activeBookId) {
      setIsLoadingEntries(false);
      return () => {
        isMounted = false;
      };
    }

    if (hasPendingInitialBootstrap) {
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
      if (!isMounted || revision !== cacheRevisionRef.current) {
        return;
      }

      setEntryCacheByBookId((currentCacheByBookId) =>
        updateBookEntryCache(currentCacheByBookId, activeBookId, (currentCache) =>
          setMonthsEntriesInCache(currentCache, months, nextEntriesByMonth),
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
    hasPendingInitialBootstrap,
    hasVisibleMonthCached,
    missingBackgroundPreloadMonths,
    missingPagePreloadMonths,
    visibleMonth,
  ]);

  useLedgerEntryRealtimeCache(activeBookId, setEntryCacheByBookId, refreshLedgerRef);

  const refreshLedger = async (invalidateCachedMonths = false) => {
    if (!activeBookId) {
      return;
    }

    setIsRefreshing(true);
    setEntriesError(null);
    const revision = ++cacheRevisionRef.current;

    try {
      const trace = createPerformanceTrace("LedgerEntries", {
        monthCount: refreshMonths.length,
        step: "refresh_visible_window_entries",
      });
      const nextEntriesByMonth = await loadLedgerMonthsEntries(activeBookId, refreshMonths);
      if (revision !== cacheRevisionRef.current) return;
      trace("refreshed_visible_window_entries", {
        entryCount: countLedgerEntriesByMonth(nextEntriesByMonth),
      });
      setEntryCacheByBookId((currentCacheByBookId) =>
        updateBookEntryCache(currentCacheByBookId, activeBookId, (currentCache) => {
          // Resume/reconnect and conversions may change months outside this window.
          const nextCache: LedgerEntryCache = invalidateCachedMonths ? {} : { ...currentCache };
          return setMonthsEntriesInCache(nextCache, refreshMonths, nextEntriesByMonth);
        }),
      );
    } catch (error) {
      if (revision !== cacheRevisionRef.current) return;
      logAppError("LedgerEntries", error, {
        activeBookId,
        step: "refresh_entries",
        visibleMonth: visibleMonth.toISOString(),
      });
      setEntriesError(AppMessages.ledgerError);
    } finally {
      if (revision === cacheRevisionRef.current) setIsRefreshing(false);
    }
  };

  refreshLedgerRef.current = refreshLedger;

  return {
    entryCache,
    entries,
    entriesError,
    isLoadingEntries,
    isLoadingChartEntries: chartLoadingCount > 0,
    isRefreshing,
    refreshLedger,
    removeEntriesFromCache: (entryIds) => {
      if (!activeBookId || entryIds.length === 0) {
        return;
      }

      setEntryCacheByBookId((currentCacheByBookId) =>
        updateBookEntryCache(currentCacheByBookId, activeBookId, (currentCache) =>
          entryIds.reduce(removeEntryFromCache, currentCache),
        ),
      );
    },
    replaceInstallmentGroupInCache: (installmentGroupId, nextEntries) => {
      if (!activeBookId) {
        return;
      }

      setEntryCacheByBookId((currentCacheByBookId) =>
        updateBookEntryCache(currentCacheByBookId, activeBookId, (currentCache) => {
          let nextCache = Object.fromEntries(
            Object.entries(currentCache).map(([monthKey, monthEntries]) => [
              monthKey,
              monthEntries.filter((entry) => entry.installmentGroupId !== installmentGroupId),
            ]),
          );

          for (const entry of nextEntries) {
            const monthKey = getMonthKey(parseIsoDate(entry.date));
            if (monthKey in currentCache) {
              nextCache = upsertEntryInCachedMonth(nextCache, entry);
            }
          }

          return nextCache;
        }),
      );
    },
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

function wait(durationMs: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, durationMs);
  });
}

function createBookMonthPreloadKey(bookId: string, month: Date) {
  return `${bookId}:${getMonthKey(month)}`;
}
