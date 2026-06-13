import * as Clipboard from "expo-clipboard";

import { CardSmsClipboardCopy } from "../constants/cardSmsClipboard";
import { resolveStaticCopyLanguage } from "../i18n/staticCopy";
import type { LedgerEntryType } from "../types/ledger";
import { formatAmountInput } from "../utils/amount";
import { parseIsoDate, toIsoDate } from "../utils/calendar";
import { isLikelyCardSms, parseCardSms, resolveParsedCardSmsIsoDate } from "./cardSmsParser";
import { logAppError } from "./logAppError";

const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const MILLISECONDS_PER_DAY =
  MILLISECONDS_PER_SECOND * SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY;

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

export function formatCardSmsClipboardDraftActionLabel(
  draft: CardSmsClipboardDraft,
  now: Date = new Date(),
): string {
  const previewLabel = [
    formatCardSmsClipboardDraftDateLabel(draft.date, now),
    `${formatAmountInput(draft.amount, "KRW")}${CardSmsClipboardCopy.amountCurrencySuffix}`,
    truncateCardSmsPreviewContent(draft.content),
  ].join(CardSmsClipboardCopy.previewSeparator);

  return `(${previewLabel}${CardSmsClipboardCopy.actionPreviewSuffix}) ${CardSmsClipboardCopy.applyAction}`;
}

function formatCardSmsClipboardDraftDateLabel(date: string | null, now: Date): string {
  if (!date) {
    return CardSmsClipboardCopy.fallbackDateLabel;
  }

  const targetDate = parseIsoDate(date);
  const today = parseIsoDate(toIsoDate(now));
  const dayOffset = Math.round((targetDate.getTime() - today.getTime()) / MILLISECONDS_PER_DAY);

  if (dayOffset === 0) {
    return CardSmsClipboardCopy.todayDateLabel;
  }

  if (dayOffset === -1) {
    return CardSmsClipboardCopy.yesterdayDateLabel;
  }

  if (dayOffset === 1) {
    return CardSmsClipboardCopy.tomorrowDateLabel;
  }

  if (dayOffset < 0) {
    return `${Math.abs(dayOffset)}${formatCardSmsClipboardDateDaysAgoSuffix()}`;
  }

  return formatCardSmsClipboardFutureDateLabel(dayOffset);
}

function formatCardSmsClipboardDateDaysAgoSuffix(): string {
  if (resolveStaticCopyLanguage() === "en") {
    return ` ${CardSmsClipboardCopy.dateDaysAgoSuffix}`;
  }

  return CardSmsClipboardCopy.dateDaysAgoSuffix;
}

function formatCardSmsClipboardFutureDateLabel(dayOffset: number): string {
  if (resolveStaticCopyLanguage() === "en") {
    return `${CardSmsClipboardCopy.dateDaysLaterPrefix} ${dayOffset} ${CardSmsClipboardCopy.dateDaysLaterSuffix}`;
  }

  return `${dayOffset}${CardSmsClipboardCopy.dateDaysLaterSuffix}`;
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
