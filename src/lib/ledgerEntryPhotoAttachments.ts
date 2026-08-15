import {
  ENTRY_PHOTO_BUCKET,
  ENTRY_PHOTO_SIGNED_URL_EXPIRES_IN_SECONDS,
} from "../constants/entryPhotos";
import type { LedgerEntryPhotoAttachment } from "../types/ledger";
import type {
  EnrichedLedgerEntryPhotoAttachmentRow,
  LedgerEntryAttachmentRow,
  LedgerEntryRow,
  ReceiptFileRow,
} from "../types/supabase";
import { logAppWarning } from "./logAppError";
import {
  mapUploadedReceiptFileAttachment,
  uploadReceiptFiles,
} from "./ledgerEntryPhotoUpload";
import { supabase } from "./supabase";

const LEDGER_ENTRY_ATTACHMENTS_TABLE = "ledger_entry_attachments";
const LEDGER_ENTRIES_TABLE = "ledger_entries";
const RECEIPT_FILES_TABLE = "receipt_files";
type ReceiptFileAttachmentSource = Pick<
  ReceiptFileRow,
  "content_type" | "id" | "original_filename" | "storage_bucket" | "storage_path"
>;

export async function createLedgerEntryPhotoSignedUrlMap(
  receiptFileRows: EnrichedLedgerEntryPhotoAttachmentRow[],
): Promise<Map<string, string>> {
  return createSignedUrlMap(receiptFileRows);
}

export function mapLedgerEntryPhotoAttachmentFromReceiptFile(
  receiptFile: EnrichedLedgerEntryPhotoAttachmentRow,
  signedUrl?: string,
) {
  return mapLedgerEntryPhotoAttachment(receiptFile, signedUrl);
}

export async function syncLedgerEntryPhotoAttachments(params: {
  entryId: string;
  installmentGroupId?: string | null;
  photoAttachments: LedgerEntryPhotoAttachment[];
  userId: string;
}): Promise<LedgerEntryPhotoAttachment[]> {
  const { entryId, installmentGroupId = null, photoAttachments, userId } = params;
  const currentAttachmentRows = await fetchCurrentAttachmentRows(entryId, installmentGroupId);
  const currentReceiptFileIds = currentAttachmentRows.map((row) => row.receipt_file_id);
  const retainedReceiptFileIds = new Set(
    photoAttachments.flatMap((attachment) => (attachment.id ? [attachment.id] : [])),
  );
  const nextLocalAttachments = photoAttachments.filter((attachment) => !attachment.id);
  const receiptFileIdsToRemove = currentReceiptFileIds.filter(
    (receiptFileId) => !retainedReceiptFileIds.has(receiptFileId),
  );

  if (receiptFileIdsToRemove.length > 0) {
    await removeReceiptFiles(receiptFileIdsToRemove);
  }

  if (nextLocalAttachments.length > 0) {
    const uploadedReceiptFiles = await uploadReceiptFiles(nextLocalAttachments, userId);
    const attachmentTargetRows = uploadedReceiptFiles.map((receiptFile) => ({
      installment_group_id: installmentGroupId,
      ledger_entry_id: installmentGroupId ? null : entryId,
      receipt_file_id: receiptFile.receiptFile.id,
      user_id: userId,
    }));

    const { error: insertError } = await supabase
      .from(LEDGER_ENTRY_ATTACHMENTS_TABLE)
      .insert(attachmentTargetRows);
    if (insertError) {
      await removeReceiptFiles(
        uploadedReceiptFiles.map((uploadedFile) => uploadedFile.receiptFile.id),
      ).catch((cleanupError) => {
        logAppWarning("LedgerEntryPhotoAttachments", "Failed to roll back uploaded photos.", {
          cleanupError,
          entryId,
          step: "rollback_attachment_link_insert",
        });
      });
      throw insertError;
    }

    let uploadedAttachmentIndex = 0;
    return photoAttachments.map((attachment) => {
      if (attachment.id) {
        return attachment;
      }

      const uploadedFile = uploadedReceiptFiles[uploadedAttachmentIndex];
      uploadedAttachmentIndex += 1;
      if (!uploadedFile) {
        throw new Error("Uploaded receipt file metadata is missing.");
      }

      return mapUploadedReceiptFileAttachment(uploadedFile);
    });
  }

  return photoAttachments;
}

export async function deleteLedgerEntryPhotoAttachmentsForEntries(
  entryRows: Pick<LedgerEntryRow, "id" | "installment_group_id">[],
) {
  if (entryRows.length === 0) {
    return;
  }

  const entryIds = entryRows.map((entryRow) => entryRow.id);
  const installmentGroupIds = [
    ...new Set(
      entryRows
        .map((entryRow) => entryRow.installment_group_id)
        .filter((installmentGroupId): installmentGroupId is string => Boolean(installmentGroupId)),
    ),
  ];
  const directAttachmentResult = await supabase
    .from(LEDGER_ENTRY_ATTACHMENTS_TABLE)
    .select("*")
    .in("ledger_entry_id", entryIds)
    .returns<LedgerEntryAttachmentRow[]>();

  if (directAttachmentResult.error) {
    throw directAttachmentResult.error;
  }

  const removableAttachmentRows = [...(directAttachmentResult.data ?? [])];
  if (installmentGroupIds.length > 0) {
    const { data: remainingInstallmentEntries, error: remainingEntriesError } = await supabase
      .from(LEDGER_ENTRIES_TABLE)
      .select("id, installment_group_id")
      .in("installment_group_id", installmentGroupIds)
      .not("id", "in", `(${entryIds.join(",")})`)
      .returns<Pick<LedgerEntryRow, "id" | "installment_group_id">[]>();

    if (remainingEntriesError) {
      throw remainingEntriesError;
    }

    const removableInstallmentGroupIds = installmentGroupIds.filter(
      (installmentGroupId) =>
        !(remainingInstallmentEntries ?? []).some(
          (entryRow) => entryRow.installment_group_id === installmentGroupId,
        ),
    );

    if (removableInstallmentGroupIds.length > 0) {
      const installmentAttachmentResult = await supabase
        .from(LEDGER_ENTRY_ATTACHMENTS_TABLE)
        .select("*")
        .in("installment_group_id", removableInstallmentGroupIds)
        .returns<LedgerEntryAttachmentRow[]>();

      if (installmentAttachmentResult.error) {
        throw installmentAttachmentResult.error;
      }

      removableAttachmentRows.push(...(installmentAttachmentResult.data ?? []));
    }
  }

  const receiptFileIds = [...new Set(removableAttachmentRows.map((row) => row.receipt_file_id))];
  if (receiptFileIds.length > 0) {
    await removeReceiptFiles(receiptFileIds);
  }
}

async function createSignedUrlMap(receiptFileRows: ReceiptFileAttachmentSource[]) {
  if (receiptFileRows.length === 0) {
    return new Map<string, string>();
  }

  const bucketFileRows = receiptFileRows.filter(
    (receiptFile) => receiptFile.storage_bucket === ENTRY_PHOTO_BUCKET,
  );
  const { data, error } = await supabase.storage.from(ENTRY_PHOTO_BUCKET).createSignedUrls(
    bucketFileRows.map((receiptFile) => receiptFile.storage_path),
    ENTRY_PHOTO_SIGNED_URL_EXPIRES_IN_SECONDS,
  );

  if (error) {
    throw error;
  }

  return new Map(
    bucketFileRows
      .map((receiptFile, index) => [receiptFile.id, data?.[index]?.signedUrl ?? ""] as const)
      .filter((entry) => entry[1]),
  );
}

async function fetchCurrentAttachmentRows(entryId: string, installmentGroupId: string | null) {
  const query = installmentGroupId
    ? supabase
        .from(LEDGER_ENTRY_ATTACHMENTS_TABLE)
        .select("*")
        .eq("installment_group_id", installmentGroupId)
    : supabase.from(LEDGER_ENTRY_ATTACHMENTS_TABLE).select("*").eq("ledger_entry_id", entryId);

  const { data, error } = await query.returns<LedgerEntryAttachmentRow[]>();
  if (error) {
    throw error;
  }

  return data ?? [];
}

function mapLedgerEntryPhotoAttachment(
  receiptFile: ReceiptFileAttachmentSource,
  signedUrl?: string,
) {
  return {
    fileName: receiptFile.original_filename,
    id: receiptFile.id,
    mimeType: receiptFile.content_type,
    storageBucket: receiptFile.storage_bucket,
    storagePath: receiptFile.storage_path,
    uri: signedUrl ?? "",
  } satisfies LedgerEntryPhotoAttachment;
}

async function removeReceiptFiles(receiptFileIds: string[]) {
  const { data: receiptFiles, error: receiptFileError } = await supabase
    .from(RECEIPT_FILES_TABLE)
    .select("*")
    .in("id", receiptFileIds)
    .returns<ReceiptFileRow[]>();

  if (receiptFileError) {
    throw receiptFileError;
  }

  const storagePaths = (receiptFiles ?? [])
    .filter((receiptFile) => receiptFile.storage_bucket === ENTRY_PHOTO_BUCKET)
    .map((receiptFile) => receiptFile.storage_path);

  if (storagePaths.length > 0) {
    const { error: removeStorageError } = await supabase.storage
      .from(ENTRY_PHOTO_BUCKET)
      .remove(storagePaths);

    if (removeStorageError) {
      throw removeStorageError;
    }
  }

  const { error: deleteFileError } = await supabase
    .from(RECEIPT_FILES_TABLE)
    .delete()
    .in("id", receiptFileIds);
  if (deleteFileError) {
    throw deleteFileError;
  }
}
