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
};

const EMPTY_ENTRIES: LedgerEntry[] = [];

export function useAllLedgerEntries({
  activeBookId,
  selectedCategoryIds,
  searchQuery,
}: UseAllLedgerEntriesParams) {
  const [entries, setEntries] = useState<LedgerEntry[]>(EMPTY_ENTRIES);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(Boolean(activeBookId));
  const [nextCursor, setNextCursor] = useState<LedgerEntriesPageCursor | null>(null);
  const queryRevisionRef = useRef(0);
  const entriesBookRef = useRef(activeBookId);
  const realtimeRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadFirstPage = useCallback(
    async () => {
      const queryRevision = queryRevisionRef.current + 1;
      queryRevisionRef.current = queryRevision;
      if (entriesBookRef.current !== activeBookId) {
        entriesBookRef.current = activeBookId;
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
          searchQuery,
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
    },
    [activeBookId, searchQuery, selectedCategoryIds],
  );

  useEffect(() => {
    void loadFirstPage();
    return () => { queryRevisionRef.current += 1; };
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
    entries: entriesBookRef.current === activeBookId ? entries : EMPTY_ENTRIES,
    errorMessage: entriesBookRef.current === activeBookId ? errorMessage : null,
    hasMore,
    isLoadingMore,
    isRefreshing: Boolean(activeBookId) && (entriesBookRef.current !== activeBookId || isRefreshing),
    loadMoreEntries,
    refreshEntries: loadFirstPage,
    removeEntriesFromFeed: (entryIds: readonly string[]) => {
      const deletedEntryIds = new Set(entryIds);
      setEntries((currentEntries) =>
        currentEntries.filter((entry) => !deletedEntryIds.has(entry.id)),
      );
    },
  };
}
