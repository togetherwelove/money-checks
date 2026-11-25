import type { AllEntriesDateRange, AllEntriesEntryTypeFilter } from "../constants/allEntries";
import { useFilteredLedgerTotals } from "./useFilteredLedgerTotals";
import { filteredLedgerQueryKey } from "../lib/filteredLedgerTotals";
import { useCallback, useEffect, useRef, useState } from "react";

import { LedgerQueryConfig, LedgerRealtimeConfig } from "../constants/ledgerQueries";
import { AppMessages } from "../constants/messages";
import { type LedgerEntriesPageCursor, fetchLedgerEntriesPage } from "../lib/ledgerEntries";
import { subscribeToLedgerEntryChanges } from "../lib/ledgerEntryRealtime";
import { logAppError } from "../lib/logAppError";
import type { LedgerEntry } from "../types/ledger";

type UseAllLedgerEntriesParams = {
  activeBookId: string | null;
  selectedCategoryIds: readonly string[];
  searchQuery: string;
  dateRange?: AllEntriesDateRange | null;
  entryTypeFilter?: AllEntriesEntryTypeFilter;
};

const EMPTY_ENTRIES: LedgerEntry[] = [];

export function useAllLedgerEntries({
  activeBookId,
  selectedCategoryIds,
  searchQuery,
  dateRange,
  entryTypeFilter,
}: UseAllLedgerEntriesParams) {
  const queryKey = filteredLedgerQueryKey({
    activeBookId,
    selectedCategoryIds,
    searchQuery,
    dateRange,
    entryTypeFilter,
  });
  const [summaryRevision, setSummaryRevision] = useState(0);
  const summary = useFilteredLedgerTotals(
    { activeBookId, selectedCategoryIds, searchQuery, dateRange, entryTypeFilter },
    summaryRevision,
  );
  const [entries, setEntries] = useState<LedgerEntry[]>(EMPTY_ENTRIES);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(Boolean(activeBookId));
  const [nextCursor, setNextCursor] = useState<LedgerEntriesPageCursor | null>(null);
  const queryRevisionRef = useRef(0);
  const requestController = useRef<AbortController | null>(null);
  const entriesBookRef = useRef(queryKey);
  const realtimeRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadFirstPage = useCallback(async () => {
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    setSummaryRevision((current) => current + 1);
    const queryRevision = queryRevisionRef.current + 1;
    queryRevisionRef.current = queryRevision;
    if (entriesBookRef.current !== queryKey) {
      entriesBookRef.current = queryKey;
      setEntries(EMPTY_ENTRIES);
      setHasMore(false);
      setNextCursor(null);
    }

    if (!activeBookId) {
      setEntries(EMPTY_ENTRIES);
      setErrorMessage(null);
      setHasMore(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
      setNextCursor(null);
      return;
    }

    setErrorMessage(null);
    setIsLoadingMore(false);
    setIsRefreshing(true);

    try {
      const {
        entries: nextEntries,
        hasMore: nextHasMore,
        nextCursor: firstPageNextCursor,
      } = await fetchLedgerEntriesPage(activeBookId, {
        ascending: false,
        categoryIds: selectedCategoryIds,
        limit: LedgerQueryConfig.allEntriesPageSize,
        signal: controller.signal,
        searchQuery,
        dateFrom: dateRange?.startDate,
        dateTo: dateRange?.endDate,
        entryType: entryTypeFilter === "all" ? undefined : entryTypeFilter,
      });
      if (queryRevisionRef.current !== queryRevision) {
        return;
      }
      setEntries(nextEntries);
      setHasMore(nextHasMore);
      setNextCursor(firstPageNextCursor);
    } catch (error) {
      if (queryRevisionRef.current !== queryRevision) {
        return;
      }
      logAppError("AllEntriesScreen", error, {
        activeBookId,
        step: "load_all_ledger_entries_first_page",
      });
      setErrorMessage(AppMessages.ledgerError);
    } finally {
      if (queryRevisionRef.current === queryRevision) {
        setIsRefreshing(false);
      }
    }
  }, [activeBookId, searchQuery, selectedCategoryIds, dateRange, entryTypeFilter, queryKey]);

  useEffect(() => {
    void loadFirstPage();
    return () => {
      queryRevisionRef.current += 1;
      requestController.current?.abort();
    };
  }, [loadFirstPage]);

  useEffect(() => {
    if (!activeBookId) {
      return;
    }

    const scheduleRealtimeRefresh = () => {
      if (realtimeRefreshTimeoutRef.current) {
        clearTimeout(realtimeRefreshTimeoutRef.current);
      }

      realtimeRefreshTimeoutRef.current = setTimeout(() => {
        realtimeRefreshTimeoutRef.current = null;
        void loadFirstPage();
      }, LedgerQueryConfig.realtimeRefreshDelayMs);
    };

    const unsubscribe = subscribeToLedgerEntryChanges({
      bookId: activeBookId,
      channelScope: LedgerRealtimeConfig.allEntriesChannelScope,
      onChange: scheduleRealtimeRefresh,
      onResync: scheduleRealtimeRefresh,
    });

    return () => {
      if (realtimeRefreshTimeoutRef.current) {
        clearTimeout(realtimeRefreshTimeoutRef.current);
        realtimeRefreshTimeoutRef.current = null;
      }
      unsubscribe();
    };
  }, [activeBookId, loadFirstPage]);

  const loadMoreEntries = useCallback(async () => {
    if (!activeBookId || isLoadingMore || isRefreshing || !hasMore) {
      return;
    }

    setIsLoadingMore(true);
    setErrorMessage(null);
    const queryRevision = queryRevisionRef.current;

    try {
      const {
        entries: nextEntries,
        hasMore: nextHasMore,
        nextCursor: loadedPageNextCursor,
      } = await fetchLedgerEntriesPage(activeBookId, {
        ascending: false,
        categoryIds: selectedCategoryIds,
        cursor: nextCursor,
        limit: LedgerQueryConfig.allEntriesPageSize,
        signal: requestController.current?.signal,
        searchQuery,
        dateFrom: dateRange?.startDate,
        dateTo: dateRange?.endDate,
        entryType: entryTypeFilter === "all" ? undefined : entryTypeFilter,
      });
      if (queryRevisionRef.current !== queryRevision) {
        return;
      }
      setEntries((currentEntries) => [...currentEntries, ...nextEntries]);
      setHasMore(nextHasMore);
      setNextCursor(loadedPageNextCursor);
    } catch (error) {
      if (queryRevisionRef.current !== queryRevision) {
        return;
      }
      logAppError("AllEntriesScreen", error, {
        activeBookId,
        cursor: nextCursor,
        step: "load_all_ledger_entries_more",
      });
      setErrorMessage(AppMessages.ledgerError);
    } finally {
      if (queryRevisionRef.current === queryRevision) {
        setIsLoadingMore(false);
      }
    }
  }, [
    activeBookId,
    hasMore,
    isLoadingMore,
    isRefreshing,
    nextCursor,
    dateRange,
    entryTypeFilter,
    searchQuery,
    selectedCategoryIds,
  ]);

  return {
    summary,
    entries: entriesBookRef.current === queryKey ? entries : EMPTY_ENTRIES,
    errorMessage: entriesBookRef.current === queryKey ? errorMessage : null,
    hasMore,
    isLoadingMore,
    isRefreshing: Boolean(activeBookId) && (entriesBookRef.current !== queryKey || isRefreshing),
    loadMoreEntries,
    refreshEntries: loadFirstPage,
    removeEntriesFromFeed: (entryIds: readonly string[]) => {
      setSummaryRevision((current) => current + 1);
      const deletedEntryIds = new Set(entryIds);
      setEntries((currentEntries) =>
        currentEntries.filter((entry) => !deletedEntryIds.has(entry.id)),
      );
    },
  };
}
