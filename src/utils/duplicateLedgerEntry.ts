import type { CategoryDefinition } from "../types/category";
import type { LedgerEntry, LedgerEntryDraft } from "../types/ledger";
import type { LedgerBookMember } from "../types/ledgerBookMember";
import { stripInstallmentNoteSuffix } from "../lib/installments";
import { createDraft, ONE_TIME_INSTALLMENT_MONTHS } from "./ledgerEntries";

export function createDuplicateEntryDraft(
  entry: LedgerEntry,
  selectedDate: string,
  userId: string,
  members: readonly LedgerBookMember[],
  categories: readonly CategoryDefinition[],
): LedgerEntryDraft {
  const memberId = entry.targetMemberId ?? entry.authorId ?? userId;
  const member = members.find((item) => item.userId === memberId)
    ?? members.find((item) => item.userId === userId);
  const category = categories.find((item) => item.id === entry.categoryId && item.type === entry.type);
  return {
    ...createDraft(selectedDate, member?.userId ?? userId),
    type: entry.type,
    amount: String(entry.amount),
    content: entry.content,
    category: category?.label ?? "",
    categoryId: category?.id ?? "",
    targetMemberName: member?.displayName,
    note: entry.installmentGroupId || (entry.installmentMonths ?? ONE_TIME_INSTALLMENT_MONTHS) > ONE_TIME_INSTALLMENT_MONTHS || entry.installmentStatus
      ? stripInstallmentNoteSuffix(entry.note) : entry.note,
  };
}
