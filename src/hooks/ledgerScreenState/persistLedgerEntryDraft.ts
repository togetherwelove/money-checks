import type { Session } from "@supabase/supabase-js";
import type { Dispatch, SetStateAction } from "react";
import { DEFAULT_MEMBER_DISPLAY_NAME } from "../../constants/ledgerDisplay";
import { buildLedgerEntriesFromDraft } from "../../lib/installments";
import type { LedgerEntry, LedgerEntryDraft, LedgerEntryPhotoAttachment } from "../../types/ledger";
import type { LedgerBook } from "../../types/ledgerBook";
import { canSubmitDraft, mergeEntries } from "../../utils/ledgerEntries";
import { resolveFallbackDisplayName } from "../../utils/sessionDisplayName";
import { saveLedgerEntries, saveLedgerEntry } from "./helpers";
import type { BusyTaskTracker } from "./types";

type Options = {
  session: Session;
  activeBook: LedgerBook | null;
  entries: LedgerEntry[];
  editingEntrySnapshot: LedgerEntry | null;
  trackBusyTask: BusyTaskTracker;
  setEntries: Dispatch<SetStateAction<LedgerEntry[]>>;
  blockReadOnlyEditIfNeeded: () => boolean;
};

export async function persistLedgerEntryDraft(
  {
    session,
    activeBook,
    entries,
    editingEntrySnapshot,
    trackBusyTask,
    setEntries,
    blockReadOnlyEditIfNeeded,
  }: Options,
  draftToSave: LedgerEntryDraft,
  targetEditingEntryId: string | null,
  originalEntry?: LedgerEntry,
): Promise<LedgerEntry[]> {
  if (blockReadOnlyEditIfNeeded()) {
    return [];
  }

  if (!activeBook) {
    return [];
  }

  if (!canSubmitDraft(draftToSave)) {
    return [];
  }

  if (targetEditingEntryId) {
    const sourceEntry =
      originalEntry ??
      (editingEntrySnapshot?.id === targetEditingEntryId
        ? editingEntrySnapshot
        : entries.find((entry) => entry.id === targetEditingEntryId));
    const authorName = sourceEntry?.authorName ?? resolveCurrentUserDisplayName(session, entries);
    const nextEntry: LedgerEntry = {
      ...sourceEntry,
      authorId: sourceEntry?.authorId ?? session.user.id,
      authorHasBookAccess: sourceEntry?.authorHasBookAccess ?? true,
      authorName,
      id: targetEditingEntryId,
      date: draftToSave.date,
      type: draftToSave.type,
      amount: Number(draftToSave.amount),
      targetMemberId: draftToSave.targetMemberId,
      targetMemberHasBookAccess: sourceEntry?.targetMemberHasBookAccess ?? true,
      targetMemberName:
        draftToSave.targetMemberName ??
        (draftToSave.targetMemberId === session.user.id ? authorName : undefined),
      content: draftToSave.content.trim(),
      category: draftToSave.category.trim(),
      categoryId: draftToSave.categoryId.trim(),
      note: draftToSave.note.trim(),
      photoAttachments: draftToSave.photoAttachments,
      sourceType: "manual",
    };

    const savedEntry = await saveLedgerEntry({
      activeBookId: activeBook.id,
      editingEntryId: targetEditingEntryId,
      entry: nextEntry,
      syncPhotoAttachments: havePhotoAttachmentsChanged(
        sourceEntry?.photoAttachments ?? [],
        draftToSave.photoAttachments,
      ),
      trackBusyTask,
      userId: session.user.id,
    });
    setEntries((currentEntries) =>
      currentEntries.map((entry) => (entry.id === savedEntry.id ? savedEntry : entry)),
    );
    return [savedEntry];
  }

  const authorName = resolveCurrentUserDisplayName(session, entries);
  const entriesToSave = buildLedgerEntriesFromDraft(draftToSave).map((entry) => ({
    ...entry,
    authorHasBookAccess: true,
    authorId: session.user.id,
    authorName,
    targetMemberHasBookAccess: true,
    targetMemberName:
      entry.targetMemberName ?? (entry.targetMemberId === session.user.id ? authorName : undefined),
  }));
  const savedEntries = await saveLedgerEntries({
    activeBookId: activeBook.id,
    entries: entriesToSave,
    trackBusyTask,
    userId: session.user.id,
  });
  setEntries((currentEntries) => mergeEntries(currentEntries, savedEntries));

  return savedEntries;
}

function havePhotoAttachmentsChanged(
  currentAttachments: LedgerEntryPhotoAttachment[],
  nextAttachments: LedgerEntryPhotoAttachment[],
): boolean {
  if (currentAttachments.length !== nextAttachments.length) {
    return true;
  }

  return currentAttachments.some((currentAttachment, index) => {
    const nextAttachment = nextAttachments[index];
    return (
      !nextAttachment ||
      currentAttachment.id !== nextAttachment.id ||
      currentAttachment.uri !== nextAttachment.uri ||
      currentAttachment.fileName !== nextAttachment.fileName ||
      currentAttachment.mimeType !== nextAttachment.mimeType
    );
  });
}

function resolveCurrentUserDisplayName(session: Session, entries: LedgerEntry[]): string {
  const cachedEntryName = entries.find((entry) => entry.authorId === session.user.id)?.authorName;
  return (
    cachedEntryName?.trim() ||
    resolveFallbackDisplayName(session.user.user_metadata, session.user.email).trim() ||
    DEFAULT_MEMBER_DISPLAY_NAME
  );
}
