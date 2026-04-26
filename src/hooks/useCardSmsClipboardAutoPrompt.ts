import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

import {
  type CardSmsClipboardDraft,
  promptCardSmsClipboardImport,
} from "../lib/cardSmsClipboardImport";

type UseCardSmsClipboardAutoPromptOptions = {
  baseDate: Date;
  enabled: boolean;
  onApply: (draft: CardSmsClipboardDraft) => void;
  onSkip?: () => void;
  shouldIgnoreDraft?: (draft: CardSmsClipboardDraft) => boolean;
};

export function useCardSmsClipboardAutoPrompt({
  baseDate,
  enabled,
  onApply,
  onSkip,
  shouldIgnoreDraft,
}: UseCardSmsClipboardAutoPromptOptions) {
  const lastPromptedClipboardRef = useRef<string | null>(null);
  const onApplyRef = useRef(onApply);
  const onSkipRef = useRef(onSkip);
  const shouldIgnoreDraftRef = useRef(shouldIgnoreDraft);
  const previousAppStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    onApplyRef.current = onApply;
  }, [onApply]);

  useEffect(() => {
    onSkipRef.current = onSkip;
  }, [onSkip]);

  useEffect(() => {
    shouldIgnoreDraftRef.current = shouldIgnoreDraft;
  }, [shouldIgnoreDraft]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void promptCardSmsClipboardImport({
      baseDate,
      lastPromptedClipboardRef,
      onApply: (draft) => onApplyRef.current(draft),
      onSkip: onSkipRef.current ? () => onSkipRef.current?.() : undefined,
      shouldIgnoreDraft: (draft) => shouldIgnoreDraftRef.current?.(draft) ?? false,
    });

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      const previousAppState = previousAppStateRef.current;
      previousAppStateRef.current = nextAppState;

      if (previousAppState === "active" || nextAppState !== "active") {
        return;
      }

      void promptCardSmsClipboardImport({
        baseDate,
        lastPromptedClipboardRef,
        onApply: (draft) => onApplyRef.current(draft),
        onSkip: onSkipRef.current ? () => onSkipRef.current?.() : undefined,
        shouldIgnoreDraft: (draft) => shouldIgnoreDraftRef.current?.(draft) ?? false,
      });
    });

    return () => {
      subscription.remove();
    };
  }, [baseDate, enabled]);
}
