import type { LedgerDayNote } from "../../types/ledger";
import { addMonths, getMonthKey, parseIsoDate } from "../../utils/calendar";

export type LedgerDayNoteCache = Record<string, LedgerDayNote[]>;

const CALENDAR_VISIBLE_WINDOW_OFFSETS = [-1, 0, 1] as const;

export function getVisibleWindowDateNoteMap(
  dateNoteCache: LedgerDayNoteCache,
  visibleMonth: Date,
): Map<string, LedgerDayNote> {
  return new Map(
    CALENDAR_VISIBLE_WINDOW_OFFSETS.flatMap((monthOffset) =>
      (dateNoteCache[getMonthKey(addMonths(visibleMonth, monthOffset))] ?? []).map(
        (dateNote): [string, LedgerDayNote] => [dateNote.date, dateNote],
      ),
    ),
  );
}

export function hasCachedLedgerDayNoteMonth(
  dateNoteCache: LedgerDayNoteCache,
  month: Date,
): boolean {
  return getMonthKey(month) in dateNoteCache;
}

export function setMonthDateNotesInCache(
  dateNoteCache: LedgerDayNoteCache,
  month: Date,
  nextDateNotes: LedgerDayNote[],
): LedgerDayNoteCache {
  return {
    ...dateNoteCache,
    [getMonthKey(month)]: [...nextDateNotes].sort(compareLedgerDayNotes),
  };
}

export function upsertDateNoteInCache(
  dateNoteCache: LedgerDayNoteCache,
  nextDateNote: LedgerDayNote,
): LedgerDayNoteCache {
  const monthKey = getMonthKey(parseIsoDate(nextDateNote.date));
  const nextMonthDateNotes = [...(dateNoteCache[monthKey] ?? [])];
  const existingDateNoteIndex = nextMonthDateNotes.findIndex(
    (dateNote) => dateNote.date === nextDateNote.date,
  );

  if (existingDateNoteIndex >= 0) {
    nextMonthDateNotes[existingDateNoteIndex] = nextDateNote;
  } else {
    nextMonthDateNotes.push(nextDateNote);
  }

  return {
    ...dateNoteCache,
    [monthKey]: nextMonthDateNotes.sort(compareLedgerDayNotes),
  };
}

export function removeDateNoteFromCache(
  dateNoteCache: LedgerDayNoteCache,
  isoDate: string,
): LedgerDayNoteCache {
  const monthKey = getMonthKey(parseIsoDate(isoDate));
  const nextMonthDateNotes = (dateNoteCache[monthKey] ?? []).filter(
    (dateNote) => dateNote.date !== isoDate,
  );

  return {
    ...dateNoteCache,
    [monthKey]: nextMonthDateNotes,
  };
}

function compareLedgerDayNotes(left: LedgerDayNote, right: LedgerDayNote): number {
  if (left.date !== right.date) {
    return left.date.localeCompare(right.date);
  }

  return left.id.localeCompare(right.id);
}
