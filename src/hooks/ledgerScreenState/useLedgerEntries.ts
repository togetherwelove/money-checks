import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";

import { DEFAULT_MEMBER_DISPLAY_NAME } from "../../constants/ledgerDisplay";
import { AppMessages } from "../../constants/messages";
import { logAppError } from "../../lib/logAppError";
import { fetchProfileDisplayName } from "../../lib/profiles";
import { supabase } from "../../lib/supabase";
import type { LedgerEntry } from "../../types/ledger";
import type { LedgerEntryRow } from "../../types/supabase";
import { mapLedgerEntryRow } from "../../utils/ledgerMapper";
import { getLedgerWindowEnd, getLedgerWindowStart } from "../../utils/ledgerMonthWindow";
import { loadBookEntries } from "./helpers";
import {
  isLedgerEntryRowInWindow,
  removeRealtimeLedgerEntry,
  upsertRealtimeLedgerEntry,
} from "./realtimeEntryUpdates";

type LedgerEntriesState = {
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
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [entriesError, setEntriesError] = useState<string | null>(null);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadEntries = async () => {
      if (!activeBookId) {
        setEntries([]);
        setIsLoadingEntries(false);
        return;
      }

      setIsLoadingEntries(true);
      setEntriesError(null);

      try {
        const nextEntries = await loadBookEntries(activeBookId, visibleMonth);
        if (isMounted) {
          setEntries(nextEntries);
        }
      } catch (error) {
        logAppError("LedgerEntries", error, {
          activeBookId,
          step: "load_entries",
          visibleMonth: visibleMonth.toISOString(),
        });
        if (isMounted) {
          setEntriesError(AppMessages.ledgerError);
        }
      } finally {
        if (isMounted) {
          setIsLoadingEntries(false);
        }
      }
    };

    void loadEntries();

    return () => {
      isMounted = false;
    };
  }, [activeBookId, visibleMonth]);

  useEffect(() => {
    if (!activeBookId) {
      return;
    }

    const windowStart = getLedgerWindowStart(visibleMonth);
    const windowEnd = getLedgerWindowEnd(visibleMonth);

    const handleLedgerEntryChange = async (
      payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
    ) => {
      if (payload.eventType === "DELETE") {
        const deletedEntryId = typeof payload.old.id === "string" ? payload.old.id : null;
        if (!deletedEntryId) {
          return;
        }

        setEntries((currentEntries) => removeRealtimeLedgerEntry(currentEntries, deletedEntryId));
        return;
      }

      const changedRow = payload.new as LedgerEntryRow;
      if (!isLedgerEntryRowInWindow(changedRow, windowStart, windowEnd)) {
        setEntries((currentEntries) => removeRealtimeLedgerEntry(currentEntries, changedRow.id));
        return;
      }

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
        authorName = DEFAULT_MEMBER_DISPLAY_NAME;
      }

      setEntries((currentEntries) => {
        const currentEntry = currentEntries.find((entry) => entry.id === changedRow.id);
        const nextEntry = mapLedgerEntryRow(
          changedRow,
          currentEntry?.authorId === changedRow.user_id
            ? (currentEntry.authorName ?? authorName)
            : authorName,
        );
        return upsertRealtimeLedgerEntry(currentEntries, nextEntry);
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
  }, [activeBookId, visibleMonth]);

  const refreshLedger = async () => {
    if (!activeBookId) {
      return;
    }

    setIsRefreshing(true);
    setEntriesError(null);

    try {
      const nextEntries = await loadBookEntries(activeBookId, visibleMonth);
      setEntries(nextEntries);
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
    entries,
    entriesError,
    isLoadingEntries,
    isRefreshing,
    refreshLedger,
    setEntries,
  };
}
