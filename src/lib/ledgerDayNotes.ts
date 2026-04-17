import type { LedgerDayNote } from "../types/ledger";
import type { LedgerDayNoteRow } from "../types/supabase";
import { supabase } from "./supabase";

const LEDGER_DAY_NOTE_TABLE = "ledger_day_notes";

export async function fetchLedgerDayNotes(
  bookId: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<LedgerDayNote[]> {
  let query = supabase
    .from(LEDGER_DAY_NOTE_TABLE)
    .select("*")
    .eq("book_id", bookId)
    .order("occurred_on", { ascending: true });

  if (dateFrom) {
    query = query.gte("occurred_on", dateFrom);
  }

  if (dateTo) {
    query = query.lte("occurred_on", dateTo);
  }

  const { data, error } = await query.returns<LedgerDayNoteRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapLedgerDayNoteRow);
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
