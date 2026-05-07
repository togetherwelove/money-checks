import { DEFAULT_MEMBER_DISPLAY_NAME } from "../constants/ledgerDisplay";
import type { AccessibleLedgerBook, LedgerBook } from "../types/ledgerBook";
import type {
  JoinSharedLedgerBookPreview,
  JoinSharedLedgerBookResolution,
  JoinSharedLedgerBookResult,
  LedgerBookJoinRequest,
} from "../types/ledgerBookJoinRequest";
import type { LedgerBookMember } from "../types/ledgerBookMember";
import type {
  AccessibleLedgerBookRow,
  LedgerBookJoinPreviewRow,
  LedgerBookJoinRequestProfileRow,
  LedgerBookMemberProfileRow,
  LedgerBookRow,
} from "../types/supabase";
import { mapAccessibleLedgerBookRow, mapLedgerBookRow } from "../utils/ledgerBookMapper";
import { logAppError, logAppWarning } from "./logAppError";
import { supabase } from "./supabase";

const GET_ACCESSIBLE_LEDGER_BOOK_FUNCTION = "get_accessible_ledger_book";
const GET_ACCESSIBLE_LEDGER_BOOKS_FUNCTION = "get_accessible_ledger_books";
const GET_ACTIVE_LEDGER_BOOK_FUNCTION = "get_active_ledger_book";
const ENSURE_OWN_PERSONAL_LEDGER_BOOK_FUNCTION = "ensure_own_personal_ledger_book";
const CREATE_OWNED_LEDGER_BOOK_FUNCTION = "create_owned_ledger_book";
const SWITCH_ACTIVE_LEDGER_BOOK_FUNCTION = "switch_active_ledger_book";
const UPDATE_ACTIVE_LEDGER_BOOK_NAME_FUNCTION = "update_active_ledger_book_name";
const PREVIEW_LEDGER_BOOK_JOIN_FUNCTION = "preview_ledger_book_join_by_code";
const REQUEST_LEDGER_BOOK_JOIN_FUNCTION = "request_ledger_book_join_by_code";

export async function fetchLedgerBookById(bookId: string): Promise<LedgerBook> {
  const { data, error: bookError } = await supabase
    .rpc(GET_ACCESSIBLE_LEDGER_BOOK_FUNCTION, { target_book_id: bookId })
    .returns<LedgerBookRow[]>();

  const book = resolveLedgerBookRow(data);

  if (bookError || !book) {
    throw bookError ?? new Error("Failed to load the requested ledger book.");
  }

  return mapLedgerBookRow(book);
}

export async function fetchActiveLedgerBook(userId: string): Promise<LedgerBook | null> {
  const { data, error } = await supabase
    .rpc(GET_ACTIVE_LEDGER_BOOK_FUNCTION)
    .returns<LedgerBookRow[]>();

  const activeBook = resolveLedgerBookRow(data);
  if (error) {
    logAppError("LedgerBooks", error, {
      step: "get_active_ledger_book",
      userId,
    });
    throw error;
  }

  if (!activeBook) {
    const { data: ensuredBookId, error: ensureBookError } = await supabase.rpc(
      ENSURE_OWN_PERSONAL_LEDGER_BOOK_FUNCTION,
    );

    if (ensureBookError || typeof ensuredBookId !== "string" || !ensuredBookId) {
      throw ensureBookError ?? new Error("Failed to provision the personal ledger book.");
    }

    return fetchLedgerBookById(ensuredBookId);
  }

  return mapLedgerBookRow(activeBook);
}

export async function fetchAccessibleLedgerBooks(): Promise<AccessibleLedgerBook[]> {
  const { data, error } = await supabase
    .rpc(GET_ACCESSIBLE_LEDGER_BOOKS_FUNCTION)
    .returns<AccessibleLedgerBookRow[]>();

  if (error) {
    throw error;
  }

  const bookRows = Array.isArray(data) ? data : [];
  return bookRows.filter(isAccessibleLedgerBookRow).map(mapAccessibleLedgerBookRow);
}

export async function createOwnedLedgerBook(nextName: string): Promise<LedgerBook> {
  const { data, error } = await supabase
    .rpc(CREATE_OWNED_LEDGER_BOOK_FUNCTION, { next_name: nextName })
    .returns<LedgerBookRow[]>();

  const createdBook = resolveLedgerBookRow(data);

  if (error || !createdBook) {
    throw error ?? new Error("Failed to create the ledger book.");
  }

  return mapLedgerBookRow(createdBook);
}

export async function switchActiveLedgerBook(bookId: string): Promise<LedgerBook> {
  const { data, error } = await supabase
    .rpc(SWITCH_ACTIVE_LEDGER_BOOK_FUNCTION, { target_book_id: bookId })
    .returns<LedgerBookRow[]>();

  const switchedBook = resolveLedgerBookRow(data);

  if (error || !switchedBook) {
    throw error ?? new Error("Failed to switch the active ledger book.");
  }

  return mapLedgerBookRow(switchedBook);
}

export async function updateActiveLedgerBookName(nextName: string): Promise<LedgerBook> {
  const { data, error } = await supabase
    .rpc(UPDATE_ACTIVE_LEDGER_BOOK_NAME_FUNCTION, { next_name: nextName })
    .returns<LedgerBookRow[]>();

  const updatedBook = resolveLedgerBookRow(data);

  if (error || !updatedBook) {
    throw error ?? new Error("Failed to update the active ledger book name.");
  }

  return mapLedgerBookRow(updatedBook);
}

export async function previewLedgerBookJoinByCode(
  shareCode: string,
): Promise<JoinSharedLedgerBookPreview> {
  const { data, error } = await supabase
    .rpc(PREVIEW_LEDGER_BOOK_JOIN_FUNCTION, { input_code: shareCode })
    .returns<LedgerBookJoinPreviewRow[]>();

  const previewRow = Array.isArray(data) ? data[0] : null;
  if (error || !isLedgerBookJoinPreviewRow(previewRow)) {
    throw error ?? new Error("Failed to preview shared ledger book access.");
  }

  return {
    status: previewRow.status,
    targetBookId: previewRow.target_book_id,
    targetBookName: previewRow.target_book_name,
  };
}

export async function requestLedgerBookJoinByCode(
  shareCode: string,
  joinResolution?: JoinSharedLedgerBookResolution,
): Promise<JoinSharedLedgerBookResult> {
  const { data, error } = await supabase.rpc(REQUEST_LEDGER_BOOK_JOIN_FUNCTION, {
    input_code: shareCode,
    join_resolution: joinResolution ?? "standard",
  });

  if (error || (data !== "joined" && data !== "requested")) {
    throw error ?? new Error("Failed to request shared ledger book access.");
  }

  return data;
}

export async function approveLedgerBookJoinRequest(requestId: string): Promise<void> {
  const { error } = await supabase.rpc("approve_ledger_book_join_request", {
    target_request_id: requestId,
  });

  if (error) {
    throw error;
  }
}

export async function rejectLedgerBookJoinRequest(requestId: string): Promise<void> {
  const { error } = await supabase.rpc("reject_ledger_book_join_request", {
    target_request_id: requestId,
  });

  if (error) {
    throw error;
  }
}

export async function fetchPendingLedgerBookJoinRequests(
  bookId: string,
): Promise<LedgerBookJoinRequest[]> {
  const { data, error } = await supabase
    .rpc("get_pending_ledger_book_join_requests", { target_book_id: bookId })
    .returns<LedgerBookJoinRequestProfileRow[]>();

  if (error) {
    throw error;
  }

  const requestRows = Array.isArray(data) ? data : [];

  return requestRows.map((request) => ({
    approvalStatus: request.approval_status,
    id: request.id,
    joinResolution: request.join_resolution,
    requestedAt: request.created_at,
    requesterDisplayName: request.display_name?.trim() || DEFAULT_MEMBER_DISPLAY_NAME,
    requesterUserId: request.requester_user_id,
  }));
}

export async function leaveActiveLedgerBook(): Promise<void> {
  const { error } = await supabase.rpc("leave_active_ledger_book");

  if (error) {
    throw error;
  }
}

export async function removeMemberFromActiveLedgerBook(targetUserId: string): Promise<void> {
  const { error } = await supabase.rpc("remove_member_from_active_ledger_book", {
    target_user_id: targetUserId,
  });

  if (error) {
    throw error;
  }
}

export async function fetchLedgerBookMembers(bookId: string): Promise<LedgerBookMember[]> {
  const { data, error } = await supabase
    .rpc("get_ledger_book_members", { target_book_id: bookId })
    .returns<LedgerBookMemberProfileRow[]>();

  if (error) {
    throw error;
  }

  const memberRows = Array.isArray(data) ? data : [];

  return memberRows.map((member: LedgerBookMemberProfileRow) => ({
    displayName: member.display_name?.trim() || DEFAULT_MEMBER_DISPLAY_NAME,
    role: member.role,
    userId: member.user_id,
  }));
}

function resolveLedgerBookRow(data: unknown): LedgerBookRow | null {
  if (Array.isArray(data)) {
    const firstRow = data[0];
    return isLedgerBookRow(firstRow) ? firstRow : null;
  }

  return isLedgerBookRow(data) ? data : null;
}

function isLedgerBookRow(value: unknown): value is LedgerBookRow {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<LedgerBookRow>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.owner_id === "string" &&
    typeof candidate.share_code === "string"
  );
}

function isAccessibleLedgerBookRow(value: unknown): value is AccessibleLedgerBookRow {
  if (!isLedgerBookRow(value)) {
    return false;
  }

  const candidate = value as Partial<AccessibleLedgerBookRow>;
  return (
    candidate.member_role === "owner" ||
    candidate.member_role === "editor" ||
    candidate.member_role === "viewer"
  );
}

function isLedgerBookJoinPreviewRow(value: unknown): value is LedgerBookJoinPreviewRow {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<LedgerBookJoinPreviewRow>;
  return typeof candidate.status === "string";
}
