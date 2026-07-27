import { useCallback, useEffect, useRef, useState } from "react";

import { LedgerQueryConfig, LedgerRealtimeConfig } from "../constants/ledgerQueries";
import { AppMessages } from "../constants/messages";
import { type LedgerEntriesPageCursor, fetchLedgerEntriesPage } from "../lib/ledgerEntries";
import { subscribeToLedgerEntryChanges } from "../lib/ledgerEntryRealtime";
import { logAppError } from "../lib/logAppError";
import type { LedgerEntry } from "../types/ledger";
import { compareLedgerEntriesByCreatedAtDesc } from "../utils/ledgerEntryOrdering";
import type { BusyTaskTracker } from "./ledgerScreenState/types";

type UseAllLedgerEntriesParams = {
  activeBookId: string | null;
  selectedCategoryIds: readonly string[];
  searchQuery: string;
  trackBlockingTask: BusyTaskTracker;
};

const EMPTY_ENTRIES: LedgerEntry[] = [];

export function useAllLedgerEntries({
  activeBookId,
  selectedCategoryIds,
  searchQuery,
  trackBlockingTask,
}: UseAllLedgerEntriesParams) {
  const [entries, setEntries] = useState<LedgerEntry[]>(EMPTY_ENTRIES);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nextCursor, setNextCursor] = useState<LedgerEntriesPageCursor | null>(null);
  const queryRevisionRef = useRef(0);
  const realtimeRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadFirstPage = useCallback(
    async (usesBlockingOverlay: boolean) => {
      const queryRevision = queryRevisionRef.current + 1;
      queryRevisionRef.current = queryRevision;

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
      if (!usesBlockingOverlay) {
        setIsRefreshing(true);
      }

      const executeTask = usesBlockingOverlay
        ? trackBlockingTask
        : async <T>(task: () => Promise<T>) => task();

      try {
        const {
          entries: nextEntries,
          hasMore: nextHasMore,
          nextCursor: firstPageNextCursor,
        } = await executeTask(() =>
          fetchLedgerEntriesPage(activeBookId, {
            ascending: false,
            categoryIds: selectedCategoryIds,
            limit: LedgerQueryConfig.allEntriesPageSize,
            searchQuery,
          }),
        );
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
        if (!usesBlockingOverlay && queryRevisionRef.current === queryRevision) {
          setIsRefreshing(false);
        }
      }
    },
    [activeBookId, searchQuery, selectedCategoryIds, trackBlockingTask],
  );

  useEffect(() => {
    void loadFirstPage(true);
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
        void loadFirstPage(false);
      }, LedgerQueryConfig.realtimeRefreshDelayMs);
    };

    const unsubscribe = subscribeToLedgerEntryChanges({
      bookId: activeBookId,
      channelScope: LedgerRealtimeConfig.allEntriesChannelScope,
      onChange: scheduleRealtimeRefresh,
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
        searchQuery,
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
    searchQuery,
    selectedCategoryIds,
  ]);

  return {
    entries,
    errorMessage,
    hasMore,
    isLoadingMore,
    isRefreshing,
    loadMoreEntries,
    refreshEntries: () => loadFirstPage(false),
    removeEntryFromFeed: (entryId: string) =>
      setEntries((currentEntries) => currentEntries.filter((entry) => entry.id !== entryId)),
    restoreEntryToFeed: (entryToRestore: LedgerEntry) =>
      setEntries((currentEntries) => {
        if (currentEntries.some((entry) => entry.id === entryToRestore.id)) {
          return currentEntries;
        }

        return [...currentEntries, entryToRestore].sort(compareLedgerEntriesByCreatedAtDesc);
      }),
  };
}
