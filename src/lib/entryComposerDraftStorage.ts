import { Directory, File, Paths } from "expo-file-system";
import { randomUUID } from "expo-crypto";

import { ENTRY_DRAFT_PHOTO_DIRECTORY, ENTRY_PHOTO_LIMIT } from "../constants/entryPhotos";
import type { AppStorage } from "./appStorage.shared";
import type { LedgerEntryDraft, LedgerEntryPhotoAttachment } from "../types/ledger";
import { ONE_TIME_INSTALLMENT_MONTHS } from "../utils/ledgerEntries";

export function readEntryComposerDraft(
  storage: AppStorage,
  userId: string,
  bookId: string | null,
  selectedDate: string,
): LedgerEntryDraft | null {
  if (!bookId) return null;
  const key = resolveDraftKey(userId, bookId);
  try {
    const value = storage.getItem(key);
    if (!value) return null;
    const draft = JSON.parse(value) as LedgerEntryDraft;
    if (!isValidDraft(draft)) {
      storage.removeItem(key);
      return null;
    }
    draft.photoAttachments = draft.photoAttachments.filter(
      (photo) => !isEntryDraftPhoto(photo.uri) || new File(photo.uri).exists,
    );
    return draft;
  } catch {
    storage.removeItem(key);
    return null;
  }
}

export function persistEntryComposerDraft(
  storage: AppStorage,
  userId: string,
  bookId: string | null,
  draft: LedgerEntryDraft,
  selectedDate: string,
) {
  if (!bookId) return;
  const key = resolveDraftKey(userId, bookId);
  const previousPhotos = readStoredPhotos(storage, key);
  if (!hasDraftValues(draft, selectedDate, userId)) {
    storage.removeItem(key);
    removeUnusedDraftPhotos(previousPhotos, []);
    return;
  }
  storage.setItem(key, JSON.stringify(draft));
  removeUnusedDraftPhotos(previousPhotos, draft.photoAttachments);
}

export async function persistEntryDraftPhoto(uri: string, fileName: string): Promise<string> {
  const directory = new Directory(Paths.document, ENTRY_DRAFT_PHOTO_DIRECTORY);
  directory.create({ idempotent: true, intermediates: true });
  const extension = fileName.match(/\.[a-z0-9]+$/i)?.[0] ?? ".jpg";
  const destination = new File(directory, `${randomUUID()}${extension}`);
  await new File(uri).copy(destination);
  return destination.uri;
}

export function isEntryDraftPhoto(uri: string): boolean {
  return uri.startsWith(new Directory(Paths.document, ENTRY_DRAFT_PHOTO_DIRECTORY).uri);
}

function resolveDraftKey(userId: string, bookId: string) {
  return `entry-composer-draft:${encodeURIComponent(userId)}:${encodeURIComponent(bookId)}`;
}

function readStoredPhotos(storage: AppStorage, key: string): LedgerEntryPhotoAttachment[] {
  try {
    const value = storage.getItem(key);
    if (!value) return [];
    const draft = JSON.parse(value) as Partial<LedgerEntryDraft>;
    return Array.isArray(draft.photoAttachments) ? draft.photoAttachments : [];
  } catch {
    return [];
  }
}

function removeUnusedDraftPhotos(
  previous: LedgerEntryPhotoAttachment[],
  next: LedgerEntryPhotoAttachment[],
) {
  const retainedUris = new Set(next.map((photo) => photo.uri));
  for (const photo of previous) {
    if (!retainedUris.has(photo.uri) && isEntryDraftPhoto(photo.uri)) {
      try {
        new File(photo.uri).delete();
      } catch {
        // Orphaned draft images can be removed the next time this draft changes.
      }
    }
  }
}

function isValidDraft(value: unknown): value is LedgerEntryDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<LedgerEntryDraft>;
  return (
    typeof draft.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(draft.date) &&
    (draft.type === "income" || draft.type === "expense") &&
    typeof draft.amount === "string" &&
    typeof draft.targetMemberId === "string" &&
    typeof draft.content === "string" &&
    typeof draft.category === "string" &&
    typeof draft.categoryId === "string" &&
    Number.isFinite(draft.installmentMonths) &&
    typeof draft.note === "string" &&
    Array.isArray(draft.photoAttachments) &&
    draft.photoAttachments.length <= ENTRY_PHOTO_LIMIT
  );
}

function hasDraftValues(draft: LedgerEntryDraft, selectedDate: string, userId: string) {
  return Boolean(
    draft.assetLink ||
      draft.amount ||
      draft.content ||
      draft.category ||
      draft.categoryId ||
      draft.note ||
      draft.photoAttachments.length ||
      draft.date !== selectedDate ||
      draft.type !== "expense" ||
      draft.installmentMonths !== ONE_TIME_INSTALLMENT_MONTHS ||
      draft.targetMemberId !== userId,
  );
}
