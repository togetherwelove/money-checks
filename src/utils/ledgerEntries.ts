import type { LedgerEntry, LedgerEntryDraft } from "../types/ledger";
import { sanitizeAmountDigits } from "./amount";

const EMPTY_AMOUNT = "";
const MANUAL_ENTRY_PREFIX = "manual";
export const ONE_TIME_INSTALLMENT_MONTHS = 1;

export function createDraft(isoDate: string, targetMemberId: string): LedgerEntryDraft {
  return {
    date: isoDate,
    type: "expense",
    amount: EMPTY_AMOUNT,
    targetMemberId,
    targetMemberName: undefined,
    content: "",
    category: "",
    categoryId: "",
    installmentMonths: ONE_TIME_INSTALLMENT_MONTHS,
    note: "",
    photoAttachments: [],
  };
}

export function mergeEntries(
  currentEntries: LedgerEntry[],
  nextEntries: LedgerEntry[],
): LedgerEntry[] {
  const entryMap = new Map(currentEntries.map((entry) => [entry.id, entry]));
  for (const entry of nextEntries) {
    if (!entryMap.has(entry.id)) {
      entryMap.set(entry.id, entry);
    }
  }
  return [...entryMap.values()];
}

export function upsertEntry(currentEntries: LedgerEntry[], nextEntry: LedgerEntry): LedgerEntry[] {
  const targetIndex = currentEntries.findIndex((entry) => entry.id === nextEntry.id);
  if (targetIndex === -1) {
    return [...currentEntries, nextEntry];
  }
  return currentEntries.map((entry) => (entry.id === nextEntry.id ? nextEntry : entry));
}

export function sanitizeAmountInput(value: string): string {
  return sanitizeAmountDigits(value);
}

export function canSubmitDraft(draft: LedgerEntryDraft): boolean {
  return Boolean(Number(draft.amount) && draft.content.trim() && draft.categoryId.trim());
}

export function createManualEntryId(): string {
  return `${MANUAL_ENTRY_PREFIX}-${Date.now()}`;
}
