import type { LedgerEntryRow } from "../types/supabase";

const TARGET_MEMBER_ID_KEY = "target_member_id";

export function buildLedgerEntryMetadata(targetMemberId: string): Record<string, unknown> {
  return {
    [TARGET_MEMBER_ID_KEY]: targetMemberId,
  };
}

export function resolveLedgerEntryTargetMemberId(row: LedgerEntryRow): string {
  const metadataTargetMemberId = row.metadata?.[TARGET_MEMBER_ID_KEY];
  return typeof metadataTargetMemberId === "string" && metadataTargetMemberId.trim()
    ? metadataTargetMemberId
    : row.user_id;
}
