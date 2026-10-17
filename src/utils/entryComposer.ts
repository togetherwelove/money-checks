import type { EntryComposerStep } from "../constants/entryComposer";
import type { LedgerEntryDraft } from "../types/ledger";

type RequiredDraftFields = Pick<LedgerEntryDraft, "amount" | "content" | "categoryId">;

export function getEntryComposerInvalidField(draft: RequiredDraftFields) {
  if (!Number.isFinite(Number(draft.amount)) || Number(draft.amount) <= 0) return "amount";
  if (!draft.content.trim()) return "content";
  if (!draft.categoryId.trim()) return "category";
  return null;
}

export function getEntryComposerNextStep(
  draft: RequiredDraftFields,
  step: EntryComposerStep,
  returningToReview: boolean,
): EntryComposerStep {
  if (returningToReview || step === "note") return getEntryComposerInvalidField(draft) ?? "review";
  return step === "amount" ? "content" : "category";
}
