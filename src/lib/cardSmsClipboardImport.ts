import * as Clipboard from "expo-clipboard";
import type { MutableRefObject } from "react";
import { Alert, type AlertButton } from "react-native";

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

const PROMPT_MESSAGE_SEPARATOR = "\n";

type PromptCardSmsClipboardImportOptions = {
  baseDate: Date;
  lastPromptedClipboardRef?: MutableRefObject<string | null>;
  onApply: (draft: CardSmsClipboardDraft) => void;
  onSkip?: () => void;
  shouldIgnoreDraft?: (draft: CardSmsClipboardDraft) => boolean;
};

export async function promptCardSmsClipboardImport({
  baseDate,
  lastPromptedClipboardRef,
  onApply,
  onSkip,
  shouldIgnoreDraft,
}: PromptCardSmsClipboardImportOptions): Promise<boolean> {
  try {
    const clipboardText = await Clipboard.getStringAsync();
    if (clipboardText === lastPromptedClipboardRef?.current) {
      return false;
    }

    if (!isLikelyCardSms(clipboardText)) {
      return false;
    }

    const parsedSms = parseCardSms(clipboardText);
    if (!parsedSms.amount || !parsedSms.merchantName) {
      return false;
    }

    if (lastPromptedClipboardRef) {
      lastPromptedClipboardRef.current = clipboardText;
    }

    const nextDraft: CardSmsClipboardDraft = {
      amount: String(parsedSms.amount),
      category: parsedSms.category,
      content: parsedSms.merchantName,
      date: resolveParsedCardSmsIsoDate(parsedSms, baseDate),
      type: parsedSms.isCancel ? "income" : "expense",
    };

    if (shouldIgnoreDraft?.(nextDraft)) {
      return false;
    }

    Alert.alert(
      CardSmsClipboardCopy.promptTitle,
      buildCardSmsClipboardPromptMessage(nextDraft),
      buildCardSmsClipboardPromptActions({
        draft: nextDraft,
        onApply,
        onSkip,
      }),
    );
    return true;
  } catch (error) {
    logAppError("CardSmsClipboardImport", error, {
      step: "read_clipboard",
    });
    return false;
  }
}

function buildCardSmsClipboardPromptActions({
  draft,
  onApply,
  onSkip,
}: {
  draft: CardSmsClipboardDraft;
  onApply: (draft: CardSmsClipboardDraft) => void;
  onSkip?: () => void;
}): AlertButton[] {
  const promptActions: AlertButton[] = [
    {
      style: "cancel",
      text: CardSmsClipboardCopy.cancelAction,
    },
  ];

  if (onSkip) {
    promptActions.push({
      onPress: onSkip,
      text: CardSmsClipboardCopy.skipAction,
    });
  }

  promptActions.push({
    onPress: () => onApply(draft),
    text: CardSmsClipboardCopy.applyAction,
  });

  return promptActions;
}

function buildCardSmsClipboardPromptMessage(draft: CardSmsClipboardDraft): string {
  return [
    `${draft.date ?? CardSmsClipboardCopy.unknownDateLabel}`,
    `${formatAmountInput(draft.amount)}원`,
    `${draft.content}`,
  ].join(PROMPT_MESSAGE_SEPARATOR);
}
