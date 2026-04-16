import { useCallback, useEffect, useState } from "react";

import { AppMessages } from "../constants/messages";
import { fetchLedgerEntries } from "../lib/ledgerEntries";
import { logAppError } from "../lib/logAppError";
import type { LedgerEntry } from "../types/ledger";
import type { BusyTaskTracker } from "./ledgerScreenState/types";

type UseAllLedgerEntriesParams = {
  activeBookId: string | null;
  trackBlockingTask: BusyTaskTracker;
};

export function useAllLedgerEntries({
  activeBookId,
  trackBlockingTask,
}: UseAllLedgerEntriesParams) {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadEntries = useCallback(
    async (usesBlockingOverlay: boolean) => {
      if (!activeBookId) {
        setEntries([]);
        setErrorMessage(null);
        setIsRefreshing(false);
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
        const nextEntries = await executeTask(() =>
          fetchLedgerEntries(activeBookId, undefined, undefined, {
            ascending: false,
            orderBy: "created_at",
          }),
        );
        setEntries(nextEntries);
      } catch (error) {
        logAppError("AllEntriesScreen", error, {
          activeBookId,
          step: "load_all_ledger_entries",
        });
        setErrorMessage(AppMessages.ledgerError);
      } finally {
        if (!usesBlockingOverlay) {
          setIsRefreshing(false);
        }
      }
    },
    [activeBookId, trackBlockingTask],
  );

  useEffect(() => {
    void loadEntries(true);
  }, [loadEntries]);

  return {
    entries,
    errorMessage,
    isRefreshing,
    refreshEntries: () => loadEntries(false),
    removeEntryFromFeed: (entryId: string) =>
      setEntries((currentEntries) => currentEntries.filter((entry) => entry.id !== entryId)),
  };
}
