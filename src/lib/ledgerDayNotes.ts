import type { LedgerDayNote } from "../types/ledger";
import type { LedgerDayNoteRow } from "../types/supabase";
import { createPerformanceTrace } from "./performanceTrace";
import { supabase } from "./supabase";

const LEDGER_DAY_NOTE_TABLE = "ledger_day_notes";
const GET_LEDGER_DAY_NOTES_IN_RANGE_FUNCTION = "get_ledger_day_notes_in_range";

export async function fetchLedgerDayNotes(
  bookId: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<LedgerDayNote[]> {
  const trace = createPerformanceTrace("LedgerDayNotesQuery", {
    bookId,
    dateFrom: dateFrom ?? null,
    dateTo: dateTo ?? null,
    step: "fetch_ledger_day_notes",
  });
  const { data, error } = await supabase
    .rpc(GET_LEDGER_DAY_NOTES_IN_RANGE_FUNCTION, {
      date_from: dateFrom ?? null,
      date_to: dateTo ?? null,
      target_book_id: bookId,
    })
    .returns<LedgerDayNoteRow[]>();
  const rows = Array.isArray(data) ? data : [];
  trace("fetched_ledger_day_notes", { rowCount: rows.length });

  if (error) {
    throw error;
  }

  return rows.map(mapLedgerDayNoteRow);
}

export async function upsertLedgerDayNote(
  bookId: string,
  userId: string,
  isoDate: string,
  note: string,
): Promise<LedgerDayNote> {
  const { data, error } = await supabase
    .from(LEDGER_DAY_NOTE_TABLE)
    .upsert(
      {
        book_id: bookId,
        note,
        occurred_on: isoDate,
        user_id: userId,
      },
      {
        onConflict: "book_id,occurred_on",
      },
    )
    .select("*")
    .single<LedgerDayNoteRow>();

  if (error || !data) {
    throw error ?? new Error("Failed to save ledger day note.");
  }

  return mapLedgerDayNoteRow(data);
}

export async function deleteLedgerDayNote(bookId: string, isoDate: string): Promise<void> {
  const { error } = await supabase
    .from(LEDGER_DAY_NOTE_TABLE)
    .delete()
    .eq("book_id", bookId)
    .eq("occurred_on", isoDate);

  if (error) {
    throw error;
  }
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
