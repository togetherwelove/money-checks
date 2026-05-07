import * as Clipboard from "expo-clipboard";

import { CardSmsClipboardCopy } from "../constants/cardSmsClipboard";
import type { LedgerEntryType } from "../types/ledger";
import { formatAmountInput } from "../utils/amount";
import { isLikelyCardSms, parseCardSms, resolveParsedCardSmsIsoDate } from "./cardSmsParser";
import { logAppError } from "./logAppError";

export type CardSmsClipboardDraft = {
  amount: string;
  category: string | null;
  content: string;
  date: string | null;
  type: LedgerEntryType;
};

type ReadCardSmsClipboardDraftOptions = {
  baseDate: Date;
  shouldIgnoreDraft?: (draft: CardSmsClipboardDraft) => boolean;
};

export async function readCardSmsClipboardDraft({
  baseDate,
  shouldIgnoreDraft,
}: ReadCardSmsClipboardDraftOptions): Promise<CardSmsClipboardDraft | null> {
  try {
    const clipboardText = await Clipboard.getStringAsync();
    if (!isLikelyCardSms(clipboardText)) {
      return null;
    }

    const parsedSms = parseCardSms(clipboardText);
    if (!parsedSms.amount || !parsedSms.merchantName) {
      return null;
    }

    const nextDraft: CardSmsClipboardDraft = {
      amount: String(parsedSms.amount),
      category: parsedSms.category,
      content: parsedSms.merchantName,
      date: resolveParsedCardSmsIsoDate(parsedSms, baseDate),
      type: parsedSms.isCancel ? "income" : "expense",
    };

    if (shouldIgnoreDraft?.(nextDraft)) {
      return null;
    }

    return nextDraft;
  } catch (error) {
    if (isClipboardReadDeniedError(error)) {
      return null;
    }

    logAppError("CardSmsClipboardImport", error, {
      step: "read_clipboard",
    });
    return null;
  }
}

export function formatCardSmsClipboardDraftActionLabel(draft: CardSmsClipboardDraft): string {
  const previewLabel = [
    formatCardSmsClipboardDraftDateLabel(draft.date),
    `${formatAmountInput(draft.amount)}${CardSmsClipboardCopy.amountCurrencySuffix}`,
    truncateCardSmsPreviewContent(draft.content),
  ].join(CardSmsClipboardCopy.previewSeparator);

  return `${CardSmsClipboardCopy.applyAction}(${previewLabel}${CardSmsClipboardCopy.actionPreviewSuffix})`;
}

function formatCardSmsClipboardDraftDateLabel(date: string | null): string {
  return (
    date?.replaceAll("-", CardSmsClipboardCopy.dateDisplaySeparator) ??
    CardSmsClipboardCopy.fallbackDateLabel
  );
}

function truncateCardSmsPreviewContent(content: string): string {
  if (content.length <= CardSmsClipboardCopy.actionPreviewContentMaxLength) {
    return content;
  }

  return `${content.slice(0, CardSmsClipboardCopy.actionPreviewContentMaxLength)}${CardSmsClipboardCopy.previewOmissionIndicator}`;
}

function isClipboardReadDeniedError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const normalizedMessage = error.message.toLowerCase();
  return (
    normalizedMessage.includes("clipboard") &&
    (normalizedMessage.includes("denied") || normalizedMessage.includes("not allowed"))
  );
}
