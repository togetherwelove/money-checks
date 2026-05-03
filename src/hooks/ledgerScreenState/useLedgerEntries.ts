import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { DEFAULT_MEMBER_DISPLAY_NAME } from "../../constants/ledgerDisplay";
import { AppMessages } from "../../constants/messages";
import { resolveLedgerEntryTargetMemberId } from "../../lib/ledgerEntryMetadata";
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
  getCalendarBackgroundPreloadMonths,
  getCalendarPagePreloadMonths,
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

      const nextEntriesByMonth = await Promise.all(
        months.map((month) => loadLedgerMonthEntries(activeBookId, month)),
      );
      if (!isMounted) {
        return;
      }

      setEntryCache((currentCache) =>
        months.reduce(
          (nextCache, month, index) =>
            setMonthEntriesInCache(nextCache, month, nextEntriesByMonth[index] ?? []),
          currentCache,
        ),
      );
    };

    void loadMonthsIntoCache(missingPagePreloadMonths)
      .then(() => {
        if (!isMounted) {
          return;
        }

        setIsLoadingEntries(false);
        void loadMonthsIntoCache(missingBackgroundPreloadMonths).catch((error) => {
          logAppError("LedgerEntries", error, {
            activeBookId,
            step: "preload_entries",
            visibleMonth: visibleMonth.toISOString(),
          });
        });
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
        return upsertEntryInCache(currentCache, {
          ...nextEntry,
          targetMemberName,
        });
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
