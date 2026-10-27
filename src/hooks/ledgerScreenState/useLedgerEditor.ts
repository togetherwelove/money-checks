import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { LedgerEntry, LedgerEntryDraft, LedgerEntryPhotoAttachment } from "../../types/ledger";
import { getMonthKey, parseIsoDate, startOfMonth, toIsoDate } from "../../utils/calendar";
import { createDraft, sanitizeAmountInput } from "../../utils/ledgerEntries";
import type { LedgerScreenState } from "./types";

type EditorState = Pick<
  LedgerScreenState,
  | "draft"
  | "editingEntryId"
  | "selectedDate"
  | "resetEditor"
  | "prepareDraftEntry"
  | "handleSelectDate"
  | "handleEditEntry"
  | "updateDraftField"
  | "updateDraftInstallmentMonths"
  | "updateDraftPhotoAttachments"
  | "updateDraftType"
> & {
  editingEntrySnapshot: LedgerEntry | null;
};

export function useLedgerEditor(
  userId: string,
  activeBookId: string | null,
  setVisibleMonth: Dispatch<SetStateAction<Date>>,
): EditorState {
  const [selectedDate, setSelectedDate] = useState(() => toIsoDate(new Date()));
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingEntrySnapshot, setEditingEntrySnapshot] = useState<LedgerEntry | null>(null);
  const previousActiveBookId = useRef<string | null>(null);
  const [draft, setDraft] = useState<LedgerEntryDraft>(() =>
    createDraft(toIsoDate(new Date()), userId),
  );
  useEffect(() => {
    const nextActiveBookId = activeBookId ?? null;
    if (previousActiveBookId.current === nextActiveBookId) {
      return;
    }

    previousActiveBookId.current = nextActiveBookId;
    setEditingEntryId(null);
    setEditingEntrySnapshot(null);
    setDraft(createDraft(selectedDate, userId));
  }, [activeBookId, selectedDate, userId]);

  const resetEditor = (isoDate: string) => {
    setSelectedDate(isoDate);
    setEditingEntryId(null);
    setEditingEntrySnapshot(null);
    setDraft(createDraft(isoDate, userId));
  };

  const prepareDraftEntry = (nextDraft: LedgerEntryDraft) => {
    setSelectedDate(nextDraft.date);
    setEditingEntryId(null);
    setEditingEntrySnapshot(null);
    setDraft(nextDraft);
  };

  const handleSelectDate = (isoDate: string) => {
    const nextMonth = startOfMonth(parseIsoDate(isoDate));
    setVisibleMonth((currentMonth) =>
      getMonthKey(currentMonth) === getMonthKey(nextMonth) ? currentMonth : nextMonth,
    );
    resetEditor(isoDate);
  };

  const handleEditEntry = (entry: LedgerEntry) => {
    setEditingEntryId(entry.id);
    setEditingEntrySnapshot(entry);
    setSelectedDate(entry.date);
    setDraft({
      date: entry.date,
      type: entry.type,
      amount: String(entry.amount),
      targetMemberId: entry.targetMemberId ?? entry.authorId ?? userId,
      targetMemberName: entry.targetMemberName ?? entry.authorName,
      content: entry.content,
      category: entry.category,
      categoryId: entry.categoryId,
      installmentMonths: entry.installmentMonths ?? 1,
      note: entry.note,
      photoAttachments: entry.photoAttachments,
    });
  };

  return {
    draft,
    editingEntryId,
    editingEntrySnapshot,
    selectedDate,
    resetEditor,
    prepareDraftEntry,
    handleSelectDate,
    handleEditEntry,
    updateDraftField: (field, value) =>
      setDraft((currentDraft) => ({
        ...currentDraft,
        [field]: field === "amount" ? sanitizeAmountInput(value) : value,
      })),
    updateDraftInstallmentMonths: (installmentMonths) =>
      setDraft((currentDraft) => ({ ...currentDraft, installmentMonths })),
    updateDraftPhotoAttachments: (nextPhotoAttachments: LedgerEntryPhotoAttachment[]) =>
      setDraft((currentDraft) => ({ ...currentDraft, photoAttachments: nextPhotoAttachments })),
    updateDraftType: (type) =>
      setDraft((currentDraft) => ({ ...currentDraft, category: "", categoryId: "", type })),
  };
}
