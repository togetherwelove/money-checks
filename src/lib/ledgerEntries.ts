import {
  DEFAULT_MEMBER_DISPLAY_NAME,
  DELETED_MEMBER_DISPLAY_NAME,
} from "../constants/ledgerDisplay";
import { LedgerEntrySelectColumns } from "../constants/ledgerQueries";
import type { LedgerEntry } from "../types/ledger";
import type {
  EnrichedLedgerEntryRow,
  LedgerEntryRow,
  LedgerEntrySummaryRow,
} from "../types/supabase";
import { mapLedgerEntryRow } from "../utils/ledgerMapper";
import { resolveDisplayCurrency } from "./currencyPreference";
import { buildLedgerEntryMetadata, resolveLedgerEntryTargetMemberId } from "./ledgerEntryMetadata";
import {
  createLedgerEntryPhotoSignedUrlMap,
  deleteLedgerEntryPhotoAttachmentsForEntries,
  mapLedgerEntryPhotoAttachmentFromReceiptFile,
  syncLedgerEntryPhotoAttachments,
} from "./ledgerEntryPhotoAttachments";
import { createPerformanceTrace } from "./performanceTrace";
import { supabase } from "./supabase";

const LEDGER_TABLE = "ledger_entries";
const GET_ENRICHED_LEDGER_ENTRIES_FUNCTION = "get_enriched_ledger_entries";
const GET_LEDGER_ENTRY_SUMMARIES_FUNCTION = "get_ledger_entry_summaries_with_names";
const DEFAULT_SOURCE_TYPE = "manual";

export type LedgerEntriesPageCursor = {
  createdAt: string;
  id: string;
  offset?: number;
};

type LedgerEntryOrderBy = "created_at" | "occurred_on";

export async function fetchLedgerEntries(
  bookId: string,
  dateFrom?: string,
  dateTo?: string,
  options?: {
    ascending?: boolean;
    orderBy?: LedgerEntryOrderBy;
  },
): Promise<LedgerEntry[]> {
  const trace = createPerformanceTrace("LedgerEntriesQuery", {
    bookId,
    dateFrom: dateFrom ?? null,
    dateTo: dateTo ?? null,
    step: "fetch_ledger_entries",
  });
  const rows = await fetchEnrichedLedgerEntryRows(bookId, {
    ascending: options?.ascending ?? true,
    dateFrom,
    dateTo,
    orderBy: options?.orderBy ?? "occurred_on",
  });
  trace("fetched_ledger_entries_rows", { rowCount: rows.length });

  const entries = await mapEnrichedLedgerEntries(rows, { includePhotoAttachments: true });
  trace("mapped_ledger_entries", { entryCount: entries.length });
  return entries;
}

export async function fetchLedgerEntriesSummary(
  bookId: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<LedgerEntry[]> {
  const trace = createPerformanceTrace("LedgerEntriesQuery", {
    bookId,
    dateFrom: dateFrom ?? null,
    dateTo: dateTo ?? null,
    step: "fetch_ledger_entries_summary",
  });
  const { data, error } = await supabase
    .rpc(GET_LEDGER_ENTRY_SUMMARIES_FUNCTION, {
      date_from: dateFrom ?? null,
      date_to: dateTo ?? null,
      target_book_id: bookId,
    })
    .returns<LedgerEntrySummaryRow[]>();
  const rows = Array.isArray(data) ? data : [];
  trace("fetched_ledger_entry_summary_rows", { rowCount: rows.length });

  if (error) {
    throw error;
  }

  const entries = mapLedgerEntrySummaries(rows);
  trace("mapped_ledger_entry_summaries", { entryCount: entries.length });
  return entries;
}

export async function fetchLedgerEntriesPage(
  bookId: string,
  params: {
    cursor?: LedgerEntriesPageCursor | null;
    limit: number;
    ascending?: boolean;
    categoryId?: string | null;
    orderBy?: LedgerEntryOrderBy;
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
    ascending = true,
    categoryId,
    orderBy = "created_at",
    searchQuery,
  } = params;
  const normalizedSearchQuery = normalizeLedgerEntrySearchQuery(searchQuery);
  const usesOffsetPagination = Boolean(normalizedSearchQuery);
  const pageOffset = usesOffsetPagination ? (cursor?.offset ?? 0) : 0;
  const rows = await fetchEnrichedLedgerEntryRows(bookId, {
    ascending,
    categoryId,
    cursor: usesOffsetPagination || orderBy !== "created_at" ? null : cursor,
    limit: limit + 1,
    orderBy,
    pageOffset,
    searchQuery: normalizedSearchQuery,
  });
  const visibleRows = rows.slice(0, limit);
  const lastRow = visibleRows[visibleRows.length - 1];
  return {
    entries: await mapEnrichedLedgerEntries(visibleRows, { includePhotoAttachments: false }),
    hasMore: rows.length > limit,
    nextCursor: lastRow
      ? {
          createdAt: lastRow.created_at,
          id: lastRow.id,
          offset: usesOffsetPagination ? pageOffset + visibleRows.length : undefined,
        }
      : null,
  };
}

function normalizeLedgerEntrySearchQuery(searchQuery?: string): string {
  return searchQuery?.trim() ?? "";
}

async function fetchEnrichedLedgerEntryRows(
  bookId: string,
  params: {
    ascending: boolean;
    categoryId?: string | null;
    cursor?: LedgerEntriesPageCursor | null;
    dateFrom?: string | null;
    dateTo?: string | null;
    installmentGroupId?: string | null;
    limit?: number | null;
    orderBy: LedgerEntryOrderBy;
    pageOffset?: number;
    searchQuery?: string;
  },
): Promise<EnrichedLedgerEntryRow[]> {
  const { data, error } = await supabase
    .rpc(GET_ENRICHED_LEDGER_ENTRIES_FUNCTION, {
      category_filter: params.categoryId ?? null,
      date_from: params.dateFrom ?? null,
      date_to: params.dateTo ?? null,
      installment_group_filter: params.installmentGroupId ?? null,
      order_ascending: params.ascending,
      order_by_column: params.orderBy,
      page_cursor_created_at: params.cursor?.createdAt ?? null,
      page_cursor_id: params.cursor?.id ?? null,
      page_limit: params.limit ?? null,
      page_offset: params.pageOffset ?? 0,
      search_query: params.searchQuery ?? null,
      target_book_id: bookId,
    })
    .returns<EnrichedLedgerEntryRow[]>();

  if (error) {
    throw error;
  }

  return Array.isArray(data) ? data : [];
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

  return fetchSavedLedgerEntries(bookId, data);
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
    userId: await resolveLedgerEntryAttachmentOwnerId(data.user_id),
  });
  const [savedEntry] = await fetchSavedLedgerEntries(data.book_id, [data]);
  return {
    ...(savedEntry ?? mapLedgerEntryRow(data)),
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
  const rows = await fetchEnrichedLedgerEntryRows(bookId, {
    ascending: true,
    installmentGroupId,
    orderBy: "occurred_on",
  });
  return mapEnrichedLedgerEntries(rows, { includePhotoAttachments: true });
}

async function fetchSavedLedgerEntries(
  bookId: string,
  savedRows: LedgerEntryRow[],
): Promise<LedgerEntry[]> {
  if (savedRows.length === 0) {
    return [];
  }

  const savedEntryIds = new Set(savedRows.map((row) => row.id));
  const savedDates = savedRows.map((row) => row.occurred_on).sort();
  const rows = await fetchEnrichedLedgerEntryRows(bookId, {
    ascending: true,
    dateFrom: savedDates[0],
    dateTo: savedDates[savedDates.length - 1],
    orderBy: "created_at",
  });
  const enrichedEntries = await mapEnrichedLedgerEntries(
    rows.filter((row) => savedEntryIds.has(row.id)),
    { includePhotoAttachments: true },
  );
  const enrichedEntryMap = new Map(enrichedEntries.map((entry) => [entry.id, entry]));

  return savedRows.map((row) => enrichedEntryMap.get(row.id) ?? mapLedgerEntryRow(row));
}

function mapLedgerEntrySummaries(rows: LedgerEntrySummaryRow[]): LedgerEntry[] {
  return rows.map((row) => ({
    ...mapLedgerEntryRow(row, resolveAuthorDisplayName(row)),
    targetMemberName: resolveTargetMemberDisplayName(row),
  }));
}

async function mapEnrichedLedgerEntries(
  rows: EnrichedLedgerEntryRow[],
  options: { includePhotoAttachments: boolean },
): Promise<LedgerEntry[]> {
  const receiptFileRows = options.includePhotoAttachments
    ? rows.flatMap((row) => normalizeEnrichedPhotoAttachmentRows(row.photo_attachments))
    : [];
  const signedUrlMap = await createLedgerEntryPhotoSignedUrlMap(receiptFileRows);

  return rows.map((row) => ({
    ...mapLedgerEntryRow(row, resolveAuthorDisplayName(row)),
    authorHasBookAccess: row.author_has_book_access,
    photoAttachments: options.includePhotoAttachments
      ? normalizeEnrichedPhotoAttachmentRows(row.photo_attachments).map((attachmentRow) =>
          mapLedgerEntryPhotoAttachmentFromReceiptFile(
            attachmentRow,
            signedUrlMap.get(attachmentRow.id),
          ),
        )
      : [],
    targetMemberHasBookAccess: row.target_member_has_book_access,
    targetMemberName: resolveTargetMemberDisplayName(row),
  }));
}

function resolveAuthorDisplayName(row: LedgerEntrySummaryRow): string {
  if (!row.user_id) {
    return DELETED_MEMBER_DISPLAY_NAME;
  }

  return row.author_display_name?.trim() || DEFAULT_MEMBER_DISPLAY_NAME;
}

function resolveTargetMemberDisplayName(row: LedgerEntrySummaryRow): string {
  const targetMemberName = row.target_member_display_name?.trim();
  if (targetMemberName) {
    return targetMemberName;
  }

  const targetMemberId = resolveLedgerEntryTargetMemberId(row);
  if (!targetMemberId || targetMemberId === row.user_id) {
    return resolveAuthorDisplayName(row);
  }

  return DELETED_MEMBER_DISPLAY_NAME;
}

async function resolveLedgerEntryAttachmentOwnerId(entryUserId: string | null): Promise<string> {
  if (entryUserId) {
    return entryUserId;
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.id) {
    throw error ?? new Error("Authenticated user is required to update ledger entry photos.");
  }

  return data.user.id;
}

function normalizeEnrichedPhotoAttachmentRows(
  photoAttachments: EnrichedLedgerEntryRow["photo_attachments"],
) {
  return Array.isArray(photoAttachments) ? photoAttachments : [];
}
