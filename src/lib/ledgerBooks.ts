import { DEFAULT_MEMBER_DISPLAY_NAME } from "../constants/ledgerDisplay";
import type { LedgerBook } from "../types/ledgerBook";
import type {
  JoinSharedLedgerBookResult,
  LedgerBookJoinRequest,
} from "../types/ledgerBookJoinRequest";
import type { LedgerBookMember } from "../types/ledgerBookMember";
import type {
  LedgerBookJoinRequestProfileRow,
  LedgerBookMemberProfileRow,
  LedgerBookRow,
} from "../types/supabase";
import { mapLedgerBookRow } from "../utils/ledgerBookMapper";
import { logAppError, logAppWarning } from "./logAppError";
import { supabase } from "./supabase";

const GET_ACCESSIBLE_LEDGER_BOOK_FUNCTION = "get_accessible_ledger_book";
const GET_ACTIVE_LEDGER_BOOK_FUNCTION = "get_active_ledger_book";
const ENSURE_OWN_PERSONAL_LEDGER_BOOK_FUNCTION = "ensure_own_personal_ledger_book";
const UPDATE_ACTIVE_LEDGER_BOOK_NAME_FUNCTION = "update_active_ledger_book_name";

export async function fetchLedgerBookById(bookId: string): Promise<LedgerBook> {
  const { data, error: bookError } = await supabase
    .rpc(GET_ACCESSIBLE_LEDGER_BOOK_FUNCTION, { target_book_id: bookId })
    .returns<LedgerBookRow[]>();

  const book = Array.isArray(data) ? data[0] : null;

  if (bookError || !book) {
    throw bookError ?? new Error("Failed to load the requested ledger book.");
  }

  return mapLedgerBookRow(book);
}

export async function fetchActiveLedgerBook(userId: string): Promise<LedgerBook | null> {
  const { data, error } = await supabase
    .rpc(GET_ACTIVE_LEDGER_BOOK_FUNCTION)
    .returns<LedgerBookRow[]>();

  const activeBook = Array.isArray(data) ? data[0] : null;
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

export async function updateActiveLedgerBookName(nextName: string): Promise<LedgerBook> {
  const { data, error } = await supabase
    .rpc(UPDATE_ACTIVE_LEDGER_BOOK_NAME_FUNCTION, { next_name: nextName })
    .returns<LedgerBookRow[]>();

  const updatedBook = Array.isArray(data) ? data[0] : null;

  if (error || !updatedBook) {
    throw error ?? new Error("Failed to update the active ledger book name.");
  }

  return mapLedgerBookRow(updatedBook);
}

export async function requestLedgerBookJoinByCode(
  shareCode: string,
): Promise<JoinSharedLedgerBookResult> {
  const { data, error } = await supabase.rpc("request_ledger_book_join_by_code", {
    input_code: shareCode,
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
    id: request.id,
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
