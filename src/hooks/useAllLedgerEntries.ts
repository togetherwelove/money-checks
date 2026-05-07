import { useCallback, useEffect, useState } from "react";

import { LedgerQueryConfig } from "../constants/ledgerQueries";
import { AppMessages } from "../constants/messages";
import { type LedgerEntriesPageCursor, fetchLedgerEntriesPage } from "../lib/ledgerEntries";
import { logAppError } from "../lib/logAppError";
import type { LedgerEntry } from "../types/ledger";
import type { BusyTaskTracker } from "./ledgerScreenState/types";

type UseAllLedgerEntriesParams = {
  activeBookId: string | null;
  selectedCategoryId: string | null;
  searchQuery: string;
  trackBlockingTask: BusyTaskTracker;
};

const EMPTY_ENTRIES: LedgerEntry[] = [];

function compareEntriesByCreatedAtDesc(leftEntry: LedgerEntry, rightEntry: LedgerEntry) {
  const createdAtComparison = (rightEntry.createdAt ?? "").localeCompare(
    leftEntry.createdAt ?? "",
  );
  if (createdAtComparison !== 0) {
    return createdAtComparison;
  }

  return leftEntry.id.localeCompare(rightEntry.id);
}

export function useAllLedgerEntries({
  activeBookId,
  selectedCategoryId,
  searchQuery,
  trackBlockingTask,
}: UseAllLedgerEntriesParams) {
  const [entries, setEntries] = useState<LedgerEntry[]>(EMPTY_ENTRIES);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nextCursor, setNextCursor] = useState<LedgerEntriesPageCursor | null>(null);

  const loadFirstPage = useCallback(
    async (usesBlockingOverlay: boolean) => {
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
            categoryId: selectedCategoryId,
            limit: LedgerQueryConfig.allEntriesPageSize,
            searchQuery,
          }),
        );
        setEntries(nextEntries);
        setHasMore(nextHasMore);
        setNextCursor(firstPageNextCursor);
      } catch (error) {
        logAppError("AllEntriesScreen", error, {
          activeBookId,
          step: "load_all_ledger_entries_first_page",
        });
        setErrorMessage(AppMessages.ledgerError);
      } finally {
        if (!usesBlockingOverlay) {
          setIsRefreshing(false);
        }
      }
    },
    [activeBookId, searchQuery, selectedCategoryId, trackBlockingTask],
  );

  useEffect(() => {
    void loadFirstPage(true);
  }, [loadFirstPage]);

  const loadMoreEntries = useCallback(async () => {
    if (!activeBookId || isLoadingMore || isRefreshing || !hasMore) {
      return;
    }

    setIsLoadingMore(true);
    setErrorMessage(null);

    try {
      const {
        entries: nextEntries,
        hasMore: nextHasMore,
        nextCursor: loadedPageNextCursor,
      } = await fetchLedgerEntriesPage(activeBookId, {
        categoryId: selectedCategoryId,
        cursor: nextCursor,
        limit: LedgerQueryConfig.allEntriesPageSize,
        searchQuery,
      });
      setEntries((currentEntries) => [...currentEntries, ...nextEntries]);
      setHasMore(nextHasMore);
      setNextCursor(loadedPageNextCursor);
    } catch (error) {
      logAppError("AllEntriesScreen", error, {
        activeBookId,
        cursor: nextCursor,
        step: "load_all_ledger_entries_more",
      });
      setErrorMessage(AppMessages.ledgerError);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    activeBookId,
    hasMore,
    isLoadingMore,
    isRefreshing,
    nextCursor,
    searchQuery,
    selectedCategoryId,
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

        return [...currentEntries, entryToRestore].sort(compareEntriesByCreatedAtDesc);
      }),
  };
}
