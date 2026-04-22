import type { LedgerEntry, LedgerEntryDraft } from "../types/ledger";
import { parseIsoDate, toIsoDate } from "../utils/calendar";
import { ONE_TIME_INSTALLMENT_MONTHS } from "../utils/ledgerEntries";

const INSTALLMENT_GROUP_PREFIX = "installment";
const INSTALLMENT_NOTE_PATTERN = /\(\d+\/\d+\)$/;
const INSTALLMENT_SETTLEMENT_NOTE_SUFFIX = "남은 할부 정리";
export const MAX_INSTALLMENT_MONTHS = 24;

export function buildLedgerEntriesFromDraft(draft: LedgerEntryDraft): LedgerEntry[] {
  const amount = Number(draft.amount);
  const trimmedContent = draft.content.trim();
  const trimmedCategory = draft.category.trim();
  const trimmedNote = draft.note.trim();
  const photoAttachments = draft.photoAttachments;

  if (draft.installmentMonths <= ONE_TIME_INSTALLMENT_MONTHS) {
    return [
      {
        id: "",
        date: draft.date,
        type: draft.type,
        amount,
        targetMemberId: draft.targetMemberId,
        content: trimmedContent,
        category: trimmedCategory,
        note: trimmedNote,
        photoAttachments,
        sourceType: "manual",
      },
    ];
  }

  const installmentGroupId = createInstallmentGroupId();
  const installmentAmounts = splitInstallmentAmount(amount, draft.installmentMonths);

  return installmentAmounts.map((installmentAmount, index) => {
    const installmentOrder = index + 1;
    return {
      id: "",
      date: resolveInstallmentDate(draft.date, index),
      type: draft.type,
      amount: installmentAmount,
      targetMemberId: draft.targetMemberId,
      content: trimmedContent,
      category: trimmedCategory,
      installmentGroupId,
      installmentMonths: draft.installmentMonths,
      installmentOrder,
      note: appendInstallmentNote(trimmedNote, installmentOrder, draft.installmentMonths),
      photoAttachments,
      sourceType: "manual",
    };
  });
}

export function formatInstallmentLabel(installmentMonths: number): string {
  if (installmentMonths <= ONE_TIME_INSTALLMENT_MONTHS) {
    return "일시불";
  }

  return `${installmentMonths}개월`;
}

export function formatInstallmentProgressLabel(entry: LedgerEntry): string | null {
  if (
    !entry.installmentMonths ||
    entry.installmentMonths <= ONE_TIME_INSTALLMENT_MONTHS ||
    !entry.installmentOrder
  ) {
    return null;
  }

  if (entry.installmentOrder < entry.installmentMonths) {
    return `할부 ${entry.installmentOrder}/${entry.installmentMonths} 진행 중`;
  }

  return `할부 ${entry.installmentOrder}/${entry.installmentMonths}`;
}

export function buildInstallmentSettlementEntry(
  currentEntry: LedgerEntry,
  remainingAmount: number,
): LedgerEntry {
  return {
    id: "",
    date: currentEntry.date,
    type: currentEntry.type,
    amount: remainingAmount,
    targetMemberId: currentEntry.targetMemberId,
    content: currentEntry.content,
    category: currentEntry.category,
    note: appendSettlementNote(currentEntry),
    photoAttachments: [],
    sourceType: "manual",
  };
}

export function stripInstallmentNoteSuffix(note: string): string {
  return removeInstallmentNote(note);
}

function appendSettlementNote(entry: LedgerEntry): string {
  const baseNote = removeInstallmentNote(entry.note).trim();
  if (!baseNote) {
    return INSTALLMENT_SETTLEMENT_NOTE_SUFFIX;
  }

  return `${baseNote} ${INSTALLMENT_SETTLEMENT_NOTE_SUFFIX}`;
}

function appendInstallmentNote(note: string, installmentOrder: number, installmentMonths: number) {
  const installmentSuffix = `(${installmentOrder}/${installmentMonths})`;
  if (!note) {
    return installmentSuffix;
  }

  return `${note} ${installmentSuffix}`;
}

function removeInstallmentNote(note: string): string {
  return note.replace(INSTALLMENT_NOTE_PATTERN, "").trim();
}

function createInstallmentGroupId(): string {
  const timestamp = Date.now();
  const randomPart = Math.floor(Math.random() * 1_000_000_000).toString(36);
  return `${INSTALLMENT_GROUP_PREFIX}-${timestamp}-${randomPart}`;
}

function splitInstallmentAmount(amount: number, installmentMonths: number): number[] {
  const baseAmount = Math.floor(amount / installmentMonths);
  const remainder = amount % installmentMonths;

  return Array.from({ length: installmentMonths }, (_value, index) =>
    index < remainder ? baseAmount + 1 : baseAmount,
  );
}

function resolveInstallmentDate(isoDate: string, monthOffset: number): string {
  const baseDate = parseIsoDate(isoDate);
  const targetYear = baseDate.getFullYear();
  const targetMonthIndex = baseDate.getMonth() + monthOffset;
  const targetLastDay = new Date(targetYear, targetMonthIndex + 1, 0).getDate();
  const targetDay = Math.min(baseDate.getDate(), targetLastDay);
  return toIsoDate(new Date(targetYear, targetMonthIndex, targetDay));
}
