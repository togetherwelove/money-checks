import type { LedgerEntry, LedgerEntryDraft } from "../types/ledger";
import { ONE_TIME_INSTALLMENT_MONTHS } from "./ledgerEntries";
import { entryAssetLinkError } from "./loanRepayment";
import { AssetLinkConfig } from "../constants/assetLink";

export function hasEntryComposerValues(
  draft: LedgerEntryDraft,
  selectedDate: string,
  defaultMemberId: string,
) {
  return Boolean(
    draft.assetLink?.cashAssetId ||
      draft.assetLink?.loanAssetId ||
      draft.amount ||
      draft.content ||
      draft.note ||
      draft.categoryId ||
      draft.category ||
      draft.photoAttachments.length ||
      (draft.date && draft.date !== selectedDate) ||
      (draft.type && draft.type !== "expense") ||
      draft.installmentMonths > ONE_TIME_INSTALLMENT_MONTHS ||
      (draft.targetMemberId && draft.targetMemberId !== defaultMemberId),
  );
}

export function hasEntryComposerChanges(
  draft: LedgerEntryDraft,
  entry: LedgerEntry,
  userId: string,
) {
  return (
    JSON.stringify(draft.assetLink) !== JSON.stringify(entry.assetLink) ||
    draft.date !== entry.date ||
    draft.type !== entry.type ||
    Number(draft.amount) !== entry.amount ||
    draft.content !== entry.content ||
    draft.note !== entry.note ||
    draft.categoryId !== entry.categoryId ||
    draft.category !== entry.category ||
    draft.targetMemberId !== (entry.targetMemberId ?? entry.authorId ?? userId) ||
    draft.installmentMonths !== (entry.installmentMonths ?? ONE_TIME_INSTALLMENT_MONTHS) ||
    draft.photoAttachments.length !== entry.photoAttachments.length ||
    draft.photoAttachments.some((photo, index) => {
      const original = entry.photoAttachments[index];
      return (
        photo.id !== original.id ||
        photo.uri !== original.uri ||
        photo.fileName !== original.fileName ||
        photo.mimeType !== original.mimeType ||
        photo.storageBucket !== original.storageBucket ||
        photo.storagePath !== original.storagePath
      );
    })
  );
}

type RequiredDraftFields = Pick<LedgerEntryDraft, "amount" | "content" | "categoryId"> &
  Partial<LedgerEntryDraft>;

export function getEntryComposerInvalidField(draft: RequiredDraftFields, requireLoan = true) {
  if (!Number.isFinite(Number(draft.amount)) || Number(draft.amount) <= 0) return "amount";
  if (!draft.content.trim()) return "content";
  if (!draft.categoryId.trim()) return "category";
  if (draft.assetLink || draft.categoryId === AssetLinkConfig.loanCategoryId) {
    if (entryAssetLinkError(draft as LedgerEntryDraft, undefined, undefined, requireLoan))
      return "assetLink";
  }
  return null;
}
