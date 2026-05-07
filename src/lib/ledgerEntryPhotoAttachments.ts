import {
  ENTRY_PHOTO_BUCKET,
  ENTRY_PHOTO_RANDOM_MAX,
  ENTRY_PHOTO_SIGNED_URL_EXPIRES_IN_SECONDS,
  ENTRY_PHOTO_STORAGE_FOLDER,
} from "../constants/entryPhotos";
import type { LedgerEntryPhotoAttachment } from "../types/ledger";
import type { LedgerEntryAttachmentRow, LedgerEntryRow, ReceiptFileRow } from "../types/supabase";
import { supabase } from "./supabase";

const LEDGER_ENTRY_ATTACHMENTS_TABLE = "ledger_entry_attachments";
const LEDGER_ENTRIES_TABLE = "ledger_entries";
const RECEIPT_FILES_TABLE = "receipt_files";
const DEFAULT_ATTACHMENT_CONTENT_TYPE = "image/jpeg";
const FILE_NAME_REPLACEMENT_PATTERN = /[^A-Za-z0-9._-]/g;
const FILE_NAME_FALLBACK = "photo.jpg";
const STORAGE_PATH_SEPARATOR = "/";

type FileSystemModule = {
  File: new (...segments: string[]) => { arrayBuffer: () => Promise<ArrayBuffer> };
};

export async function fetchLedgerEntryPhotoAttachmentMap(
  entryRows: LedgerEntryRow[],
): Promise<Map<string, LedgerEntryPhotoAttachment[]>> {
  if (entryRows.length === 0) {
    return new Map();
  }

  const entryIds = entryRows.map((row) => row.id);
  const installmentGroupIds = [
    ...new Set(
      entryRows
        .map((row) => row.installment_group_id)
        .filter((installmentGroupId): installmentGroupId is string => Boolean(installmentGroupId)),
    ),
  ];
  const directAttachmentQuery = supabase
    .from(LEDGER_ENTRY_ATTACHMENTS_TABLE)
    .select("*")
    .in("ledger_entry_id", entryIds)
    .returns<LedgerEntryAttachmentRow[]>();
  const installmentAttachmentQuery =
    installmentGroupIds.length > 0
      ? supabase
          .from(LEDGER_ENTRY_ATTACHMENTS_TABLE)
          .select("*")
          .in("installment_group_id", installmentGroupIds)
          .returns<LedgerEntryAttachmentRow[]>()
      : Promise.resolve({
          data: [] as LedgerEntryAttachmentRow[],
          error: null,
        });
  const [directAttachmentResult, installmentAttachmentResult] = await Promise.all([
    directAttachmentQuery,
    installmentAttachmentQuery,
  ]);

  if (directAttachmentResult.error) {
    throw directAttachmentResult.error;
  }

  if (installmentAttachmentResult.error) {
    throw installmentAttachmentResult.error;
  }

  const attachmentRows = [
    ...(directAttachmentResult.data ?? []),
    ...(installmentAttachmentResult.data ?? []),
  ];

  if (attachmentRows.length === 0) {
    return new Map();
  }

  const receiptFileIds = [...new Set(attachmentRows.map((row) => row.receipt_file_id))];
  const { data: receiptFileRows, error: receiptFileError } = await supabase
    .from(RECEIPT_FILES_TABLE)
    .select("*")
    .in("id", receiptFileIds)
    .returns<ReceiptFileRow[]>();

  if (receiptFileError) {
    throw receiptFileError;
  }

  const receiptFileMap = new Map((receiptFileRows ?? []).map((row) => [row.id, row]));
  const signedUrlMap = await createSignedUrlMap(receiptFileRows ?? []);
  const entryMap = new Map<string, LedgerEntryPhotoAttachment[]>();
  const entryIdsByInstallmentGroup = new Map<string, string[]>();

  for (const entryRow of entryRows) {
    if (!entryRow.installment_group_id) {
      continue;
    }

    const currentEntryIds = entryIdsByInstallmentGroup.get(entryRow.installment_group_id) ?? [];
    currentEntryIds.push(entryRow.id);
    entryIdsByInstallmentGroup.set(entryRow.installment_group_id, currentEntryIds);
  }

  for (const attachmentRow of attachmentRows) {
    const receiptFile = receiptFileMap.get(attachmentRow.receipt_file_id);
    if (!receiptFile) {
      continue;
    }

    const attachment = mapLedgerEntryPhotoAttachment(receiptFile, signedUrlMap.get(receiptFile.id));
    if (attachmentRow.ledger_entry_id) {
      appendPhotoAttachment(entryMap, attachmentRow.ledger_entry_id, attachment);
      continue;
    }

    if (attachmentRow.installment_group_id) {
      const groupedEntryIds =
        entryIdsByInstallmentGroup.get(attachmentRow.installment_group_id) ?? [];
      for (const entryId of groupedEntryIds) {
        appendPhotoAttachment(entryMap, entryId, attachment);
      }
    }
  }

  return entryMap;
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
      receipt_file_id: receiptFile.id,
      user_id: userId,
    }));

    const { error: insertError } = await supabase
      .from(LEDGER_ENTRY_ATTACHMENTS_TABLE)
      .insert(attachmentTargetRows);
    if (insertError) {
      throw insertError;
    }
  }

  const entryRows: LedgerEntryRow[] = [
    {
      amount: 0,
      book_id: "",
      category: "",
      category_id: "",
      content: "",
      created_at: "",
      currency: "",
      entry_type: "expense",
      id: entryId,
      installment_group_id: installmentGroupId,
      installment_months: null,
      installment_order: null,
      metadata: {},
      note: "",
      occurred_on: "",
      source_type: "manual",
      updated_at: "",
      user_id: userId,
    },
  ];

  const attachmentMap = await fetchLedgerEntryPhotoAttachmentMap(entryRows);
  return attachmentMap.get(entryId) ?? [];
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

function appendPhotoAttachment(
  entryMap: Map<string, LedgerEntryPhotoAttachment[]>,
  entryId: string,
  attachment: LedgerEntryPhotoAttachment,
) {
  const currentAttachments = entryMap.get(entryId) ?? [];
  currentAttachments.push(attachment);
  entryMap.set(entryId, currentAttachments);
}

async function createSignedUrlMap(receiptFileRows: ReceiptFileRow[]) {
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

function mapLedgerEntryPhotoAttachment(receiptFile: ReceiptFileRow, signedUrl?: string) {
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

async function uploadReceiptFiles(
  attachments: LedgerEntryPhotoAttachment[],
  userId: string,
): Promise<ReceiptFileRow[]> {
  const fileSystem = (await import("expo-file-system")) as unknown as FileSystemModule;
  const uploadedReceiptFiles: ReceiptFileRow[] = [];

  for (const attachment of attachments) {
    const storagePath = buildStoragePath(userId, attachment.fileName);
    const attachmentFile = new fileSystem.File(attachment.uri);
    const arrayBuffer = await attachmentFile.arrayBuffer();
    const contentType = attachment.mimeType ?? DEFAULT_ATTACHMENT_CONTENT_TYPE;

    const { error: uploadError } = await supabase.storage
      .from(ENTRY_PHOTO_BUCKET)
      .upload(storagePath, arrayBuffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: receiptFileRow, error: receiptFileError } = await supabase
      .from(RECEIPT_FILES_TABLE)
      .insert({
        content_type: contentType,
        original_filename: attachment.fileName,
        storage_bucket: ENTRY_PHOTO_BUCKET,
        storage_path: storagePath,
        user_id: userId,
      })
      .select("*")
      .single<ReceiptFileRow>();

    if (receiptFileError || !receiptFileRow) {
      throw receiptFileError ?? new Error("Failed to save receipt file.");
    }

    uploadedReceiptFiles.push(receiptFileRow);
  }

  return uploadedReceiptFiles;
}

function buildStoragePath(userId: string, fileName: string) {
  const sanitizedFileName = sanitizeFileName(fileName);
  const uniquePrefix = `${Date.now()}-${Math.floor(Math.random() * ENTRY_PHOTO_RANDOM_MAX)}`;
  return [userId, ENTRY_PHOTO_STORAGE_FOLDER, `${uniquePrefix}-${sanitizedFileName}`].join(
    STORAGE_PATH_SEPARATOR,
  );
}

function sanitizeFileName(fileName: string) {
  const sanitizedFileName = fileName.replace(FILE_NAME_REPLACEMENT_PATTERN, "-");
  return sanitizedFileName || FILE_NAME_FALLBACK;
}
