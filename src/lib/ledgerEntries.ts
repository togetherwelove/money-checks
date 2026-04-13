import { DEFAULT_MEMBER_DISPLAY_NAME } from "../constants/ledgerDisplay";
import type { LedgerEntry } from "../types/ledger";
import type { LedgerEntryRow, ProfileDisplayRow } from "../types/supabase";
import { mapLedgerEntryRow } from "../utils/ledgerMapper";
import { supabase } from "./supabase";

const LEDGER_TABLE = "ledger_entries";
const PROFILE_TABLE = "profiles";
const DEFAULT_CURRENCY = "KRW";
const DEFAULT_SOURCE_TYPE = "manual";

export async function fetchLedgerEntries(
  bookId: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<LedgerEntry[]> {
  let query = supabase
    .from(LEDGER_TABLE)
    .select("*")
    .eq("book_id", bookId)
    .order("occurred_on", { ascending: true });

  if (dateFrom) {
    query = query.gte("occurred_on", dateFrom);
  }

  if (dateTo) {
    query = query.lte("occurred_on", dateTo);
  }

  const { data, error } = await query.returns<LedgerEntryRow[]>();

  if (error) {
    throw error;
  }

  return mapLedgerEntries(data ?? []);
}

export async function fetchFirstLedgerEntryDate(bookId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from(LEDGER_TABLE)
    .select("occurred_on")
    .eq("book_id", bookId)
    .order("occurred_on", { ascending: true })
    .limit(1)
    .maybeSingle<{ occurred_on: string }>();

  if (error) {
    throw error;
  }

  return data?.occurred_on ?? null;
}

export async function fetchLedgerEntryDateBounds(bookId: string): Promise<{
  firstDate: string;
  lastDate: string;
} | null> {
  const [firstResult, lastResult] = await Promise.all([
    supabase
      .from(LEDGER_TABLE)
      .select("occurred_on")
      .eq("book_id", bookId)
      .order("occurred_on", { ascending: true })
      .limit(1)
      .maybeSingle<{ occurred_on: string }>(),
    supabase
      .from(LEDGER_TABLE)
      .select("occurred_on")
      .eq("book_id", bookId)
      .order("occurred_on", { ascending: false })
      .limit(1)
      .maybeSingle<{ occurred_on: string }>(),
  ]);

  if (firstResult.error) {
    throw firstResult.error;
  }

  if (lastResult.error) {
    throw lastResult.error;
  }

  if (!firstResult.data?.occurred_on || !lastResult.data?.occurred_on) {
    return null;
  }

  return {
    firstDate: firstResult.data.occurred_on,
    lastDate: lastResult.data.occurred_on,
  };
}

export async function insertLedgerEntry(
  bookId: string,
  userId: string,
  entry: LedgerEntry,
): Promise<LedgerEntry> {
  const { data, error } = await supabase
    .from(LEDGER_TABLE)
    .insert({
      book_id: bookId,
      user_id: userId,
      source_type: DEFAULT_SOURCE_TYPE,
      entry_type: entry.type,
      occurred_on: entry.date,
      amount: entry.amount,
      content: entry.content,
      currency: DEFAULT_CURRENCY,
      category: entry.category,
      note: entry.note,
    })
    .select("*")
    .single<LedgerEntryRow>();

  if (error || !data) {
    throw error ?? new Error("Failed to create ledger entry.");
  }

  return (await mapLedgerEntries([data]))[0];
}

export async function updateLedgerEntry(entry: LedgerEntry): Promise<LedgerEntry> {
  const { data, error } = await supabase
    .from(LEDGER_TABLE)
    .update({
      entry_type: entry.type,
      occurred_on: entry.date,
      amount: entry.amount,
      content: entry.content,
      category: entry.category,
      note: entry.note,
    })
    .eq("id", entry.id)
    .select("*")
    .single<LedgerEntryRow>();

  if (error || !data) {
    throw error ?? new Error("Failed to update ledger entry.");
  }

  return (await mapLedgerEntries([data]))[0];
}

export async function deleteLedgerEntry(entryId: string): Promise<void> {
  const { error } = await supabase.from(LEDGER_TABLE).delete().eq("id", entryId);
  if (error) {
    throw error;
  }
}

async function mapLedgerEntries(rows: LedgerEntryRow[]): Promise<LedgerEntry[]> {
  const authorNameMap = await fetchAuthorNameMap(rows);
  return rows.map((row) =>
    mapLedgerEntryRow(row, authorNameMap.get(row.user_id) ?? DEFAULT_MEMBER_DISPLAY_NAME),
  );
}

async function fetchAuthorNameMap(rows: LedgerEntryRow[]): Promise<Map<string, string>> {
  const userIds = [...new Set(rows.map((row) => row.user_id))];
  if (userIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .select("id, display_name")
    .in("id", userIds)
    .returns<ProfileDisplayRow[]>();

  if (error) {
    throw error;
  }

  return new Map(
    (data ?? []).map((profile) => [
      profile.id,
      profile.display_name || DEFAULT_MEMBER_DISPLAY_NAME,
    ]),
  );
}
