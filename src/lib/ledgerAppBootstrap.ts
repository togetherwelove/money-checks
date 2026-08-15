import type { LedgerEntry } from "../types/ledger";
import type { AccessibleLedgerBook, LedgerBook } from "../types/ledgerBook";
import type { LedgerAppBootstrapRow } from "../types/supabase";
import { mapAccessibleLedgerBookRow, mapLedgerBookRow } from "../utils/ledgerBookMapper";
import { mapLedgerEntrySummaries } from "./ledgerEntries";
import { createPerformanceTrace } from "./performanceTrace";
import { supabase } from "./supabase";

const GET_LEDGER_APP_BOOTSTRAP_FUNCTION = "get_ledger_app_bootstrap";

export type LedgerAppBootstrap = {
  activeBook: LedgerBook;
  books: AccessibleLedgerBook[];
  entries: LedgerEntry[];
};

export async function fetchLedgerAppBootstrap(
  userId: string,
  dateFrom: string,
  dateTo: string,
): Promise<LedgerAppBootstrap> {
  const trace = createPerformanceTrace("LedgerAppBootstrap", {
    dateFrom,
    dateTo,
    userId,
  });
  const { data, error } = await supabase
    .rpc(GET_LEDGER_APP_BOOTSTRAP_FUNCTION, {
      date_from: dateFrom,
      date_to: dateTo,
    })
    .returns<LedgerAppBootstrapRow[]>();
  const row = Array.isArray(data) ? data[0] : null;

  if (error || !row) {
    throw error ?? new Error("Failed to load the ledger app bootstrap state.");
  }

  const activeBookRow = row.books.find((book) => book.id === row.active_book_id);
  if (!activeBookRow) {
    throw new Error("The active ledger book is missing from the bootstrap state.");
  }

  const books = row.books.map(mapAccessibleLedgerBookRow);
  const entries = mapLedgerEntrySummaries(row.entries);
  trace("loaded_bootstrap", {
    activeBookId: row.active_book_id,
    bookCount: books.length,
    entryCount: entries.length,
  });

  return {
    activeBook: mapLedgerBookRow(activeBookRow),
    books,
    entries,
  };
}
