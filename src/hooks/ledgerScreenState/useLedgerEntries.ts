import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { DEFAULT_MEMBER_DISPLAY_NAME } from "../../constants/ledgerDisplay";
import { AppMessages } from "../../constants/messages";
import { logAppError } from "../../lib/logAppError";
import { fetchProfileDisplayName } from "../../lib/profiles";
import { supabase } from "../../lib/supabase";
import type { LedgerEntry } from "../../types/ledger";
import type { LedgerEntryRow } from "../../types/supabase";
import { getMonthKey } from "../../utils/calendar";
import { mapLedgerEntryRow } from "../../utils/ledgerMapper";
import { loadLedgerMonthEntries } from "./helpers";
import {
  type LedgerEntryCache,
  getCalendarPreloadMonths,
  getVisibleWindowEntries,
  hasCachedMonth,
  removeEntryFromCache,
  replaceVisibleWindowEntries,
  setMonthEntriesInCache,
  upsertEntryInCache,
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
  const preloadMonths = useMemo(() => getCalendarPreloadMonths(visibleMonth), [visibleMonth]);
  const entries = useMemo(
    () => getVisibleWindowEntries(entryCache, visibleMonth),
    [entryCache, visibleMonth],
  );

  useEffect(() => {
    let isMounted = true;
    const activeBookChanged = cachedBookIdRef.current !== activeBookId;
    const baseCache = activeBookChanged ? {} : entryCache;
    const hasCachedEntries = Object.keys(entryCache).length > 0;

    if (activeBookChanged) {
      cachedBookIdRef.current = activeBookId;
      if (hasCachedEntries) {
        setEntryCache({});
      }
      setEntriesError(null);
      setIsLoadingEntries(false);
    }

    if (!activeBookId) {
      if (hasCachedEntries) {
        setEntryCache({});
      }
      setIsLoadingEntries(false);
      return () => {
        isMounted = false;
      };
    }

    const missingMonths = preloadMonths.filter((month) => !hasCachedMonth(baseCache, month));
    if (missingMonths.length === 0) {
      setIsLoadingEntries(false);
      return () => {
        isMounted = false;
      };
    }

    const shouldBlockOnLoad = activeBookChanged || !hasCachedMonth(baseCache, visibleMonth);
    if (shouldBlockOnLoad) {
      setIsLoadingEntries(true);
    }
    setEntriesError(null);

    void Promise.all(missingMonths.map((month) => loadLedgerMonthEntries(activeBookId, month)))
      .then((nextEntriesByMonth) => {
        if (!isMounted) {
          return;
        }

        setEntryCache((currentCache) =>
          missingMonths.reduce(
            (nextCache, month, index) =>
              setMonthEntriesInCache(nextCache, month, nextEntriesByMonth[index] ?? []),
            currentCache,
          ),
        );
      })
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
  }, [activeBookId, entryCache, preloadMonths, visibleMonth]);

  useEffect(() => {
    if (!activeBookId) {
      return;
    }

    const handleLedgerEntryChange = async (
      payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
    ) => {
      if (payload.eventType === "DELETE") {
        const deletedEntryId = typeof payload.old.id === "string" ? payload.old.id : null;
        if (!deletedEntryId) {
          return;
        }

        setEntryCache((currentCache) => removeEntryFromCache(currentCache, deletedEntryId));
        return;
      }

      const changedRow = payload.new as LedgerEntryRow;
      let authorName = DEFAULT_MEMBER_DISPLAY_NAME;
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
        return upsertEntryInCache(currentCache, nextEntry);
      });
    };

    const channel = supabase
      .channel(`ledger-book-${activeBookId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ledger_entries",
          filter: `book_id=eq.${activeBookId}`,
        },
        (payload) => {
          void handleLedgerEntryChange(
            payload as RealtimePostgresChangesPayload<Record<string, unknown>>,
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeBookId]);

  const refreshLedger = async () => {
    if (!activeBookId) {
      return;
    }

    setIsRefreshing(true);
    setEntriesError(null);

    try {
      const nextEntriesByMonth = await Promise.all(
        preloadMonths.map((month) => loadLedgerMonthEntries(activeBookId, month)),
      );
      setEntryCache((currentCache) => {
        const nextCache = { ...currentCache };
        for (const month of preloadMonths) {
          delete nextCache[getMonthKey(month)];
        }
        return preloadMonths.reduce(
          (updatedCache, month, index) =>
            setMonthEntriesInCache(updatedCache, month, nextEntriesByMonth[index] ?? []),
          nextCache,
        );
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
