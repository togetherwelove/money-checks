import {
  InstallmentMetadataKeys,
  InstallmentStatuses,
  type InstallmentStatus,
} from "../constants/installments";
import type { LedgerEntryRow } from "../types/supabase";

const TARGET_MEMBER_ID_KEY = "target_member_id";

export function buildLedgerEntryMetadata(
  targetMemberId: string,
  installmentStatus?: InstallmentStatus | null,
): Record<string, unknown> {
  const metadata: Record<string, unknown> = {
    [TARGET_MEMBER_ID_KEY]: targetMemberId,
  };
  if (installmentStatus) {
    metadata[InstallmentMetadataKeys.status] = installmentStatus;
  }

  return metadata;
}

export function resolveLedgerEntryTargetMemberId(row: LedgerEntryRow): string | null {
  if (typeof row.target_member_id === "string" && row.target_member_id.trim()) {
    return row.target_member_id;
  }

  const metadataTargetMemberId = row.metadata?.[TARGET_MEMBER_ID_KEY];
  return typeof metadataTargetMemberId === "string" && metadataTargetMemberId.trim()
    ? metadataTargetMemberId
    : row.user_id;
}

export function resolveLedgerEntryInstallmentStatus(
  row: LedgerEntryRow,
): InstallmentStatus | null {
  const metadataStatus = row.metadata?.[InstallmentMetadataKeys.status];
  if (
    metadataStatus === InstallmentStatuses.prepaid ||
    metadataStatus === InstallmentStatuses.proceeding
  ) {
    return metadataStatus;
  }

  return row.installment_group_id ? InstallmentStatuses.proceeding : null;
}
