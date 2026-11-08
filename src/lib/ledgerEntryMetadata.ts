import {
  InstallmentMetadataKeys,
  InstallmentStatuses,
  type InstallmentStatus,
} from "../constants/installments";
import type { LedgerEntryRow } from "../types/supabase";
import type { EntryAssetLink } from "../types/assetLink";
import { AssetLinkConfig } from "../constants/assetLink";

const TARGET_MEMBER_ID_KEY = "target_member_id";

export function buildLedgerEntryMetadata(
  targetMemberId: string,
  installmentStatus?: InstallmentStatus | null,
  assetLink?: EntryAssetLink,
): Record<string, unknown> {
  const metadata: Record<string, unknown> = {
    [TARGET_MEMBER_ID_KEY]: targetMemberId,
  };
  if (installmentStatus) {
    metadata[InstallmentMetadataKeys.status] = installmentStatus;
  }

  if (assetLink?.cashAssetId || assetLink?.loanAssetId)
    metadata[AssetLinkConfig.metadataKey] = assetLink;
  return metadata;
}

export function resolveEntryAssetLink(row: LedgerEntryRow): EntryAssetLink | undefined {
  const value = row.metadata?.[AssetLinkConfig.metadataKey];
  if (!value || typeof value !== "object") return undefined;
  const link = value as Partial<EntryAssetLink>;
  if (typeof link.requestId !== "string") return undefined;
  return {
    requestId: link.requestId,
    cashAssetId: typeof link.cashAssetId === "string" ? link.cashAssetId : null,
    loanAssetId: typeof link.loanAssetId === "string" ? link.loanAssetId : null,
    principal: typeof link.principal === "string" ? link.principal : "0",
    fee: typeof link.fee === "string" ? link.fee : "0",
  };
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

export function resolveLedgerEntryInstallmentStatus(row: LedgerEntryRow): InstallmentStatus | null {
  const metadataStatus = row.metadata?.[InstallmentMetadataKeys.status];
  if (
    metadataStatus === InstallmentStatuses.prepaid ||
    metadataStatus === InstallmentStatuses.proceeding
  ) {
    return metadataStatus;
  }

  return row.installment_group_id ? InstallmentStatuses.proceeding : null;
}
