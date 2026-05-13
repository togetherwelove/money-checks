import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useEffect, useMemo, useRef, useState } from "react";

import { AppMessages } from "../../constants/messages";
import {
  deleteLedgerDayNote,
  fetchLedgerDayNotes,
  upsertLedgerDayNote,
} from "../../lib/ledgerDayNotes";
import { logAppError } from "../../lib/logAppError";
import { createPerformanceTrace } from "../../lib/performanceTrace";
import { supabase } from "../../lib/supabase";
import type { LedgerDayNote } from "../../types/ledger";
import type { LedgerDayNoteRow } from "../../types/supabase";
import { getMonthKey, parseIsoDate } from "../../utils/calendar";
import { getLedgerMonthEnd, getLedgerMonthStart } from "../../utils/ledgerMonthWindow";
import {
  type LedgerDayNoteCache,
  getVisibleWindowDateNoteMap,
  hasCachedLedgerDayNoteMonth,
  removeDateNoteFromCache,
  setMonthDateNotesInCache,
  upsertDateNoteInCache,
} from "./ledgerDayNoteCache";
import { getVisibleWindowMonths } from "./ledgerEntryCache";
import type { BusyTaskTracker } from "./types";

type LedgerDayNotesState = {
  dateNoteByDate: Map<string, LedgerDayNote>;
  refreshLedgerDayNotes: () => Promise<void>;
  removeLedgerDayNote: (isoDate: string) => Promise<void>;
  saveLedgerDayNote: (isoDate: string, note: string) => Promise<LedgerDayNote | null>;
};

export function useLedgerDayNotes(
  activeBookId: string | null,
  trackBusyTask: BusyTaskTracker,
  userId: string,
  visibleMonth: Date,
): LedgerDayNotesState {
  const [dateNoteCache, setDateNoteCache] = useState<LedgerDayNoteCache>({});
  const cachedBookIdRef = useRef<string | null>(activeBookId);
  const preloadMonths = useMemo(() => getVisibleWindowMonths(visibleMonth), [visibleMonth]);
  const missingPreloadMonths = useMemo(
    () => preloadMonths.filter((month) => !hasCachedLedgerDayNoteMonth(dateNoteCache, month)),
    [dateNoteCache, preloadMonths],
  );
  const hasVisibleMonthCached = useMemo(
    () => hasCachedLedgerDayNoteMonth(dateNoteCache, visibleMonth),
    [dateNoteCache, visibleMonth],
  );
  const dateNoteByDate = useMemo(
    () => getVisibleWindowDateNoteMap(dateNoteCache, visibleMonth),
    [dateNoteCache, visibleMonth],
  );

  useEffect(() => {
    const activeBookChanged = cachedBookIdRef.current !== activeBookId;
    if (!activeBookChanged) {
      return;
    }

    cachedBookIdRef.current = activeBookId;
    setDateNoteCache({});
  }, [activeBookId]);

  useEffect(() => {
    let isMounted = true;
    if (!activeBookId) {
      return () => {
        isMounted = false;
      };
    }

    if (missingPreloadMonths.length === 0 && hasVisibleMonthCached) {
      return () => {
        isMounted = false;
      };
    }

    const trace = createPerformanceTrace("LedgerDayNotes", {
      monthCount: missingPreloadMonths.length,
      step: "load_day_note_group",
    });

    void loadLedgerDayNoteMonths(activeBookId, missingPreloadMonths)
      .then((nextDateNotesByMonth) => {
        trace("loaded_day_note_group", {
          noteCount: countLedgerDayNotesByMonth(nextDateNotesByMonth),
        });
        if (!isMounted) {
          return;
        }

        setDateNoteCache((currentCache) =>
          missingPreloadMonths.reduce((nextCache, month) => {
            const monthKey = getMonthKey(month);
            return setMonthDateNotesInCache(nextCache, month, nextDateNotesByMonth[monthKey] ?? []);
          }, currentCache),
        );
      })
      .catch((error) => {
        logAppError("LedgerDayNotes", error, {
          activeBookId,
          step: "load_day_notes",
          visibleMonth: visibleMonth.toISOString(),
        });
      });

    return () => {
      isMounted = false;
    };
  }, [activeBookId, hasVisibleMonthCached, missingPreloadMonths, visibleMonth]);

  useEffect(() => {
    if (!activeBookId) {
      return;
    }

    const channel = supabase
      .channel(`ledger-day-notes-${activeBookId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ledger_day_notes",
          filter: `book_id=eq.${activeBookId}`,
        },
        (payload) => {
          const typedPayload = payload as RealtimePostgresChangesPayload<Record<string, unknown>>;
          if (typedPayload.eventType === "DELETE") {
            const deletedIsoDate =
              typeof typedPayload.old.occurred_on === "string"
                ? typedPayload.old.occurred_on
                : null;
            if (!deletedIsoDate) {
              return;
            }

            setDateNoteCache((currentCache) =>
              removeDateNoteFromCache(currentCache, deletedIsoDate),
            );
            return;
          }

          const changedRow = typedPayload.new as LedgerDayNoteRow;
          setDateNoteCache((currentCache) =>
            upsertDateNoteInCache(currentCache, mapLedgerDayNoteRow(changedRow)),
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeBookId]);

  const refreshLedgerDayNotes = async () => {
    if (!activeBookId) {
      return;
    }

    try {
      const trace = createPerformanceTrace("LedgerDayNotes", {
        monthCount: preloadMonths.length,
        step: "refresh_day_notes",
      });
      const nextDateNotesByMonth = await loadLedgerDayNoteMonths(activeBookId, preloadMonths);
      trace("refreshed_day_notes", {
        noteCount: countLedgerDayNotesByMonth(nextDateNotesByMonth),
      });
      setDateNoteCache((currentCache) => {
        const nextCache = { ...currentCache };
        for (const month of preloadMonths) {
          delete nextCache[getMonthKey(month)];
        }

        return preloadMonths.reduce((updatedCache, month) => {
          const monthKey = getMonthKey(month);
          return setMonthDateNotesInCache(
            updatedCache,
            month,
            nextDateNotesByMonth[monthKey] ?? [],
          );
        }, nextCache);
      });
    } catch (error) {
      logAppError("LedgerDayNotes", error, {
        activeBookId,
        step: "refresh_day_notes",
        visibleMonth: visibleMonth.toISOString(),
      });
      throw new Error(AppMessages.ledgerError);
    }
  };

  const saveLedgerDayNote = async (isoDate: string, note: string) => {
    if (!activeBookId) {
      return null;
    }

    const trimmedNote = note.trim();
    if (!trimmedNote) {
      return null;
    }

    const savedDateNote = await trackBusyTask(() =>
      upsertLedgerDayNote(activeBookId, userId, isoDate, trimmedNote),
    );
    setDateNoteCache((currentCache) => upsertDateNoteInCache(currentCache, savedDateNote));
    return savedDateNote;
  };

  const removeLedgerDayNote = async (isoDate: string) => {
    if (!activeBookId) {
      return;
    }

    await trackBusyTask(() => deleteLedgerDayNote(activeBookId, isoDate));
    setDateNoteCache((currentCache) => removeDateNoteFromCache(currentCache, isoDate));
  };

  return {
    dateNoteByDate,
    refreshLedgerDayNotes,
    removeLedgerDayNote,
    saveLedgerDayNote,
  };
}

async function loadLedgerDayNoteMonths(
  bookId: string,
  months: Date[],
): Promise<Record<string, LedgerDayNote[]>> {
  if (months.length === 0) {
    return {};
  }

  const sortedMonths = [...months].sort((left, right) => left.getTime() - right.getTime());
  const firstMonth = sortedMonths[0];
  const lastMonth = sortedMonths[sortedMonths.length - 1];
  if (!firstMonth || !lastMonth) {
    return {};
  }

  const requestedMonthKeys = new Set(months.map(getMonthKey));
  const notesByMonthKey = Object.fromEntries(
    months.map((month) => [getMonthKey(month), [] as LedgerDayNote[]]),
  );
  const notes = await fetchLedgerDayNotes(
    bookId,
    getLedgerMonthStart(firstMonth),
    getLedgerMonthEnd(lastMonth),
  );

  for (const note of notes) {
    const monthKey = getMonthKey(parseIsoDate(note.date));
    if (!requestedMonthKeys.has(monthKey)) {
      continue;
    }

    notesByMonthKey[monthKey]?.push(note);
  }

  return notesByMonthKey;
}

function countLedgerDayNotesByMonth(notesByMonth: Record<string, LedgerDayNote[]>): number {
  return Object.values(notesByMonth).reduce((count, notes) => count + notes.length, 0);
}

function mapLedgerDayNoteRow(row: LedgerDayNoteRow): LedgerDayNote {
  return {
    bookId: row.book_id,
    createdAt: row.created_at,
    date: row.occurred_on,
    id: row.id,
    note: row.note,
    updatedAt: row.updated_at,
    userId: row.user_id,
  };
}
