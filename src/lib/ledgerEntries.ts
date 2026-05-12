import { DEFAULT_MEMBER_DISPLAY_NAME } from "../constants/ledgerDisplay";
import { LedgerEntrySelectColumns } from "../constants/ledgerQueries";
import type { LedgerEntry } from "../types/ledger";
import type { LedgerEntryRow, ProfileDisplayRow } from "../types/supabase";
import { mapLedgerEntryRow } from "../utils/ledgerMapper";
import { resolveDisplayCurrency } from "./currencyPreference";
import { buildLedgerEntryMetadata, resolveLedgerEntryTargetMemberId } from "./ledgerEntryMetadata";
import {
  deleteLedgerEntryPhotoAttachmentsForEntries,
  fetchLedgerEntryPhotoAttachmentMap,
  syncLedgerEntryPhotoAttachments,
} from "./ledgerEntryPhotoAttachments";
import { supabase } from "./supabase";

const LEDGER_TABLE = "ledger_entries";
const PROFILE_TABLE = "profiles";
const DEFAULT_SOURCE_TYPE = "manual";

export type LedgerEntriesPageCursor = {
  createdAt: string;
  id: string;
};

export async function fetchLedgerEntries(
  bookId: string,
  dateFrom?: string,
  dateTo?: string,
  options?: {
    ascending?: boolean;
    orderBy?: "created_at" | "occurred_on";
  },
): Promise<LedgerEntry[]> {
  let query = supabase
    .from(LEDGER_TABLE)
    .select(LedgerEntrySelectColumns.list)
    .eq("book_id", bookId)
    .order(options?.orderBy ?? "occurred_on", { ascending: options?.ascending ?? true });

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

export async function fetchLedgerEntriesSummary(
  bookId: string,
  dateFrom?: string,
  dateTo?: string,
  options?: {
    ascending?: boolean;
    orderBy?: "created_at" | "occurred_on";
  },
): Promise<LedgerEntry[]> {
  let query = supabase
    .from(LEDGER_TABLE)
    .select(LedgerEntrySelectColumns.list)
    .eq("book_id", bookId)
    .order(options?.orderBy ?? "occurred_on", { ascending: options?.ascending ?? true });

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

  return mapLedgerEntrySummaries(data ?? []);
}

export async function fetchLedgerEntriesPage(
  bookId: string,
  params: {
    cursor?: LedgerEntriesPageCursor | null;
    limit: number;
    ascending?: boolean;
    categoryId?: string | null;
    orderBy?: "created_at" | "occurred_on";
    searchQuery?: string;
  },
): Promise<{
  entries: LedgerEntry[];
  hasMore: boolean;
  nextCursor: LedgerEntriesPageCursor | null;
}> {
  const {
    cursor,
    limit,
    ascending = false,
    categoryId,
    orderBy = "created_at",
    searchQuery,
  } = params;
  let query = supabase
    .from(LEDGER_TABLE)
    .select(LedgerEntrySelectColumns.list)
    .eq("book_id", bookId)
    .order(orderBy, { ascending })
    .order("id", { ascending })
    .range(0, limit);

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  if (cursor && orderBy === "created_at" && !ascending) {
    query = query.or(buildLedgerEntryPageCursorFilter(cursor));
  }

  const normalizedSearchQuery = normalizeLedgerEntrySearchQuery(searchQuery);
  if (normalizedSearchQuery) {
    query = query.or(buildLedgerEntrySearchFilter(normalizedSearchQuery));
  }

  const { data, error } = await query.returns<LedgerEntryRow[]>();

  if (error) {
    throw error;
  }

  const rows = data ?? [];
  const visibleRows = rows.slice(0, limit);
  const lastRow = visibleRows[visibleRows.length - 1];
  return {
    entries: await mapLedgerEntriesWithoutPhotoAttachments(visibleRows),
    hasMore: rows.length > limit,
    nextCursor: lastRow ? { createdAt: lastRow.created_at, id: lastRow.id } : null,
  };
}

function normalizeLedgerEntrySearchQuery(searchQuery?: string): string {
  return searchQuery?.trim() ?? "";
}

function buildLedgerEntrySearchFilter(searchQuery: string): string {
  const escapedQuery = searchQuery.replaceAll(",", "\\,");
  return `content.ilike.%${escapedQuery}%,note.ilike.%${escapedQuery}%`;
}

function buildLedgerEntryPageCursorFilter(cursor: LedgerEntriesPageCursor): string {
  return `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`;
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
  const [savedEntry] = await insertLedgerEntries(bookId, userId, [entry]);
  if (!savedEntry) {
    throw new Error("Failed to create ledger entry.");
  }

  return savedEntry;
}

export async function insertLedgerEntries(
  bookId: string,
  userId: string,
  entries: LedgerEntry[],
): Promise<LedgerEntry[]> {
  const { data, error } = await supabase
    .from(LEDGER_TABLE)
    .insert(
      entries.map((entry) => ({
        book_id: bookId,
        user_id: userId,
        source_type: DEFAULT_SOURCE_TYPE,
        entry_type: entry.type,
        occurred_on: entry.date,
        amount: entry.amount,
        content: entry.content,
        currency: entry.currency ?? resolveDisplayCurrency(),
        category: entry.category,
        category_id: entry.categoryId,
        metadata: buildLedgerEntryMetadata(entry.targetMemberId ?? userId),
        installment_group_id: entry.installmentGroupId ?? null,
        installment_months: entry.installmentMonths ?? null,
        installment_order: entry.installmentOrder ?? null,
        note: entry.note,
      })),
    )
    .select(LedgerEntrySelectColumns.list)
    .returns<LedgerEntryRow[]>();

  if (error || !data) {
    throw error ?? new Error("Failed to create ledger entries.");
  }

  if (entries.length > 0) {
    const targetInstallmentGroupId = data[0]?.installment_group_id ?? null;
    const photoAttachments = entries[0]?.photoAttachments ?? [];
    if (data[0]?.id && photoAttachments.length > 0) {
      await syncLedgerEntryPhotoAttachments({
        entryId: data[0].id,
        installmentGroupId: targetInstallmentGroupId,
        photoAttachments,
        userId,
      });
    }
  }

  return mapLedgerEntries(data);
}

export async function updateLedgerEntry(entry: LedgerEntry): Promise<LedgerEntry> {
  const { data, error } = await supabase
    .from(LEDGER_TABLE)
    .update({
      entry_type: entry.type,
      occurred_on: entry.date,
      amount: entry.amount,
      currency: entry.currency ?? resolveDisplayCurrency(),
      content: entry.content,
      category: entry.category,
      category_id: entry.categoryId,
      metadata: buildLedgerEntryMetadata(entry.targetMemberId ?? entry.authorId ?? ""),
      note: entry.note,
    })
    .eq("id", entry.id)
    .select(LedgerEntrySelectColumns.list)
    .single<LedgerEntryRow>();

  if (error || !data) {
    throw error ?? new Error("Failed to update ledger entry.");
  }

  const savedPhotoAttachments = await syncLedgerEntryPhotoAttachments({
    entryId: data.id,
    installmentGroupId: data.installment_group_id,
    photoAttachments: entry.photoAttachments,
    userId: data.user_id,
  });
  const [savedEntry] = await mapLedgerEntries([data]);
  return {
    ...savedEntry,
    photoAttachments: savedPhotoAttachments,
  };
}

export async function deleteLedgerEntry(entryId: string): Promise<void> {
  const { data: entryRows, error: entryRowsError } = await supabase
    .from(LEDGER_TABLE)
    .select(LedgerEntrySelectColumns.attachmentCleanup)
    .eq("id", entryId)
    .returns<Pick<LedgerEntryRow, "id" | "installment_group_id">[]>();

  if (entryRowsError) {
    throw entryRowsError;
  }

  await deleteLedgerEntryPhotoAttachmentsForEntries(entryRows ?? []);

  const { error } = await supabase.from(LEDGER_TABLE).delete().eq("id", entryId);
  if (error) {
    throw error;
  }
}

export async function deleteLedgerEntries(entryIds: string[]): Promise<void> {
  if (entryIds.length === 0) {
    return;
  }

  const { data: entryRows, error: entryRowsError } = await supabase
    .from(LEDGER_TABLE)
    .select(LedgerEntrySelectColumns.attachmentCleanup)
    .in("id", entryIds)
    .returns<Pick<LedgerEntryRow, "id" | "installment_group_id">[]>();

  if (entryRowsError) {
    throw entryRowsError;
  }

  await deleteLedgerEntryPhotoAttachmentsForEntries(entryRows ?? []);

  const { error } = await supabase.from(LEDGER_TABLE).delete().in("id", entryIds);
  if (error) {
    throw error;
  }
}

export async function fetchLedgerEntriesByInstallmentGroup(
  bookId: string,
  installmentGroupId: string,
): Promise<LedgerEntry[]> {
  const { data, error } = await supabase
    .from(LEDGER_TABLE)
    .select(LedgerEntrySelectColumns.list)
    .eq("book_id", bookId)
    .eq("installment_group_id", installmentGroupId)
    .order("occurred_on", { ascending: true })
    .returns<LedgerEntryRow[]>();

  if (error) {
    throw error;
  }

  return mapLedgerEntries(data ?? []);
}

async function mapLedgerEntries(rows: LedgerEntryRow[]): Promise<LedgerEntry[]> {
  const [authorNameMap, photoAttachmentMap, targetMemberNameMap] = await Promise.all([
    fetchAuthorNameMap(rows),
    fetchLedgerEntryPhotoAttachmentMap(rows),
    fetchTargetMemberNameMap(rows),
  ]);
  return rows.map((row) => ({
    ...mapLedgerEntryRow(row, authorNameMap.get(row.user_id) ?? DEFAULT_MEMBER_DISPLAY_NAME),
    photoAttachments: photoAttachmentMap.get(row.id) ?? [],
    targetMemberName:
      targetMemberNameMap.get(resolveLedgerEntryTargetMemberId(row)) ?? DEFAULT_MEMBER_DISPLAY_NAME,
  }));
}

async function mapLedgerEntriesWithoutPhotoAttachments(
  rows: LedgerEntryRow[],
): Promise<LedgerEntry[]> {
  const [authorNameMap, targetMemberNameMap] = await Promise.all([
    fetchAuthorNameMap(rows),
    fetchTargetMemberNameMap(rows),
  ]);
  return rows.map((row) => ({
    ...mapLedgerEntryRow(row, authorNameMap.get(row.user_id) ?? DEFAULT_MEMBER_DISPLAY_NAME),
    photoAttachments: [],
    targetMemberName:
      targetMemberNameMap.get(resolveLedgerEntryTargetMemberId(row)) ?? DEFAULT_MEMBER_DISPLAY_NAME,
  }));
}

async function mapLedgerEntrySummaries(rows: LedgerEntryRow[]): Promise<LedgerEntry[]> {
  const participantNameMap = await fetchEntryParticipantNameMap(rows);

  return rows.map((row) => ({
    ...mapLedgerEntryRow(row, participantNameMap.get(row.user_id) ?? DEFAULT_MEMBER_DISPLAY_NAME),
    targetMemberName:
      participantNameMap.get(resolveLedgerEntryTargetMemberId(row)) ?? DEFAULT_MEMBER_DISPLAY_NAME,
  }));
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

async function fetchTargetMemberNameMap(rows: LedgerEntryRow[]): Promise<Map<string, string>> {
  const targetMemberIds = [
    ...new Set(rows.map((row) => resolveLedgerEntryTargetMemberId(row)).filter(Boolean)),
  ];
  if (targetMemberIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .select("id, display_name")
    .in("id", targetMemberIds)
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

async function fetchEntryParticipantNameMap(rows: LedgerEntryRow[]): Promise<Map<string, string>> {
  const participantIds = [
    ...new Set(
      rows.flatMap((row) => [row.user_id, resolveLedgerEntryTargetMemberId(row)]).filter(Boolean),
    ),
  ];
  if (participantIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .select("id, display_name")
    .in("id", participantIds)
    .returns<ProfileDisplayRow[]>();

  if (error) {
    throw error;
  }

  return new Map(
    (data ?? []).map((profile) => [
      profile.id,
      profile.display_name?.trim() || DEFAULT_MEMBER_DISPLAY_NAME,
    ]),
  );
}
