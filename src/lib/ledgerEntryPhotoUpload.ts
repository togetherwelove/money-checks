import {
  ENTRY_PHOTO_BUCKET,
  ENTRY_PHOTO_RANDOM_MAX,
  ENTRY_PHOTO_STORAGE_FOLDER,
} from "../constants/entryPhotos";
import type { LedgerEntryPhotoAttachment } from "../types/ledger";
import type { ReceiptFileRow } from "../types/supabase";
import { logAppWarning } from "./logAppError";
import { createPerformanceTrace } from "./performanceTrace";
import { supabase } from "./supabase";

const RECEIPT_FILES_TABLE = "receipt_files";
const DEFAULT_ATTACHMENT_CONTENT_TYPE = "image/jpeg";
const FILE_NAME_REPLACEMENT_PATTERN = /[^A-Za-z0-9._-]/g;
const FILE_NAME_FALLBACK = "photo.jpg";
const STORAGE_PATH_SEPARATOR = "/";

type FileSystemModule = {
  File: new (...segments: string[]) => { arrayBuffer: () => Promise<ArrayBuffer> };
};

type UploadedStorageFile = {
  attachment: LedgerEntryPhotoAttachment;
  contentType: string;
  storagePath: string;
};

export type UploadedReceiptFile = UploadedStorageFile & {
  receiptFile: ReceiptFileRow;
};

export async function uploadReceiptFiles(
  attachments: LedgerEntryPhotoAttachment[],
  userId: string,
): Promise<UploadedReceiptFile[]> {
  const trace = createPerformanceTrace("LedgerEntryPhotoUpload", {
    fileCount: attachments.length,
    step: "upload_receipt_files",
  });
  const fileSystem = (await import("expo-file-system")) as unknown as FileSystemModule;
  const uploadResults = await Promise.allSettled(
    attachments.map(async (attachment): Promise<UploadedStorageFile> => {
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

      return { attachment, contentType, storagePath };
    }),
  );
  const uploadedStorageFiles = uploadResults.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );
  const failedUpload = uploadResults.find((result) => result.status === "rejected");
  if (failedUpload?.status === "rejected") {
    await cleanupUploadedStoragePaths(uploadedStorageFiles.map((file) => file.storagePath));
    throw failedUpload.reason;
  }
  trace("uploaded_storage_files", { fileCount: uploadedStorageFiles.length });

  const { data: receiptFileRows, error: receiptFileError } = await supabase
    .from(RECEIPT_FILES_TABLE)
    .insert(
      uploadedStorageFiles.map((uploadedFile) => ({
        content_type: uploadedFile.contentType,
        original_filename: uploadedFile.attachment.fileName,
        storage_bucket: ENTRY_PHOTO_BUCKET,
        storage_path: uploadedFile.storagePath,
        user_id: userId,
      })),
    )
    .select("*")
    .returns<ReceiptFileRow[]>();

  if (receiptFileError || !receiptFileRows) {
    await cleanupUploadedStoragePaths(uploadedStorageFiles.map((file) => file.storagePath));
    throw receiptFileError ?? new Error("Failed to save receipt files.");
  }
  trace("saved_receipt_file_rows", { rowCount: receiptFileRows.length });

  const receiptFileByStoragePath = new Map(
    receiptFileRows.map((receiptFile) => [receiptFile.storage_path, receiptFile]),
  );
  return uploadedStorageFiles.map((uploadedFile) => {
    const receiptFile = receiptFileByStoragePath.get(uploadedFile.storagePath);
    if (!receiptFile) {
      throw new Error("Saved receipt file metadata is missing.");
    }

    return { ...uploadedFile, receiptFile };
  });
}

export function mapUploadedReceiptFileAttachment(
  uploadedFile: UploadedReceiptFile,
): LedgerEntryPhotoAttachment {
  return {
    fileName: uploadedFile.receiptFile.original_filename,
    id: uploadedFile.receiptFile.id,
    mimeType: uploadedFile.receiptFile.content_type,
    storageBucket: uploadedFile.receiptFile.storage_bucket,
    storagePath: uploadedFile.receiptFile.storage_path,
    uri: uploadedFile.attachment.uri,
  };
}

async function cleanupUploadedStoragePaths(storagePaths: string[]): Promise<void> {
  if (storagePaths.length === 0) {
    return;
  }

  const { error } = await supabase.storage.from(ENTRY_PHOTO_BUCKET).remove(storagePaths);
  if (error) {
    logAppWarning("LedgerEntryPhotoUpload", "Failed to clean up uploaded storage files.", {
      error,
      fileCount: storagePaths.length,
      step: "cleanup_uploaded_storage_paths",
    });
  }
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
