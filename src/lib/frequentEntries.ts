import { ONE_TIME_INSTALLMENT_MONTHS } from "../utils/ledgerEntries";
import { FrequentEntryConfig } from "../constants/frequentEntries";
import type { LedgerEntry } from "../types/ledger";
import { stripInstallmentNoteSuffix } from "./installments";
import type { AppStorage } from "./appStorage.shared";

export type FrequentEntry = Pick<
  LedgerEntry,
  "id" | "type" | "amount" | "content" | "category" | "categoryId" | "targetMemberId" | "note"
>;

function storageKey(userId: string, bookId: string): string {
  return `${FrequentEntryConfig.storagePrefix}:${encodeURIComponent(userId)}:${encodeURIComponent(bookId)}`;
}

export function readFrequentEntries(
  storage: AppStorage,
  userId: string,
  bookId: string,
): FrequentEntry[] {
  const value: unknown = JSON.parse(storage.getItem(storageKey(userId, bookId)) ?? "[]");
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is FrequentEntry =>
    Boolean(
      item &&
        typeof item.id === "string" &&
        (item.type === "income" || item.type === "expense") &&
        typeof item.amount === "number" &&
        Number.isFinite(item.amount) &&
        item.amount > 0 &&
        [item.content, item.category, item.categoryId, item.note].every(
          (field) => typeof field === "string",
        ) &&
        (item.targetMemberId === undefined || typeof item.targetMemberId === "string"),
    ),
  );
}

export function addFrequentEntry(
  storage: AppStorage,
  userId: string,
  bookId: string,
  entry: LedgerEntry,
): boolean {
  const items = readFrequentEntries(storage, userId, bookId);
  if (items.some((item) => item.id === entry.id)) return false;
  const item: FrequentEntry = {
    id: entry.id,
    type: entry.type,
    amount: entry.amount,
    content: entry.content,
    category: entry.category,
    categoryId: entry.categoryId,
    targetMemberId: entry.targetMemberId ?? entry.authorId,
    note:
      entry.installmentGroupId ||
      entry.installmentStatus ||
      (entry.installmentMonths ?? ONE_TIME_INSTALLMENT_MONTHS) > ONE_TIME_INSTALLMENT_MONTHS
        ? stripInstallmentNoteSuffix(entry.note)
        : entry.note,
  };
  storage.setItem(storageKey(userId, bookId), JSON.stringify([...items, item]));
  return true;
}

export function removeFrequentEntry(
  storage: AppStorage,
  userId: string,
  bookId: string,
  id: string,
): void {
  const items = readFrequentEntries(storage, userId, bookId).filter((item) => item.id !== id);
  storage.setItem(storageKey(userId, bookId), JSON.stringify(items));
}
