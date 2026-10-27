import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { AppState, Keyboard } from "react-native";
import type { EntryComposerHandle } from "../components/entryComposer/EntryComposer";
import { CardSmsClipboardCopy } from "../constants/cardSmsClipboard";
import {
  readCardSmsClipboardDraft,
  type CardSmsClipboardDraft,
} from "../lib/cardSmsClipboardImport";
import { showNativeToast } from "../lib/nativeToast";
import { createScopedClipboardReader } from "../lib/scopedClipboardReader";
import type { LedgerEntryDraft } from "../types/ledger";
import { createDraft } from "../utils/ledgerEntries";
import type { LedgerScreenState } from "./ledgerScreenState/types";

type Options = {
  ledgerState: Pick<
    LedgerScreenState,
    "activeBook" | "entries" | "selectedDate" | "isReadOnlyDueToPlanLimit"
  >;
  userId: string;
  isSignedInInteractionReady: boolean;
  isEntrySheetOpen: boolean;
  isComposerPresented: boolean;
  composerVisibleRef: RefObject<boolean>;
  entryComposerRef: RefObject<EntryComposerHandle | null>;
  navigationRef: { getCurrentRoute: () => { name: string } | undefined };
  navigateToEntryFromCalendar: () => void;
  handleReadOnlyEditBlocked: () => void;
  setIsComposerVisible: (visible: boolean) => void;
};

export function useEntryClipboard({
  ledgerState,
  userId,
  isSignedInInteractionReady,
  isEntrySheetOpen,
  isComposerPresented,
  composerVisibleRef,
  entryComposerRef,
  navigationRef,
  navigateToEntryFromCalendar,
  handleReadOnlyEditBlocked,
  setIsComposerVisible,
}: Options) {
  const lastHandledClipboardRef = useRef<string | null>(null);
  const clipboardReadInFlightRef = useRef(false);
  const clipboardPasteInFlightRef = useRef(false);
  const pendingClipboardCheckRef = useRef(true);
  const [clipboardCheckRevision, setClipboardCheckRevision] = useState(0);
  const previousClipboardImportAppStateRef = useRef(AppState.currentState);
  const [clipboardSuggestionDraft, setClipboardSuggestionDraft] =
    useState<CardSmsClipboardDraft | null>(null);
  const shouldIgnoreCardSmsClipboardDraft = useCallback(
    (clipboardDraft: CardSmsClipboardDraft) => {
      const targetDate = clipboardDraft.date ?? ledgerState.selectedDate;
      return ledgerState.entries.some(
        (entry) =>
          entry.date === targetDate &&
          entry.amount === Number(clipboardDraft.amount) &&
          entry.content.trim() === clipboardDraft.content.trim() &&
          entry.type === clipboardDraft.type,
      );
    },
    [ledgerState.entries, ledgerState.selectedDate],
  );

  const clipboardScopeRef = useRef<string | null>(null);
  const clipboardDetectionMountedRef = useRef(true);
  const clipboardScope =
    isSignedInInteractionReady && !ledgerState.isReadOnlyDueToPlanLimit
      ? (ledgerState.activeBook?.id ?? null)
      : null;
  clipboardScopeRef.current = clipboardScope;
  const clipboardReader = useMemo(
    () => createScopedClipboardReader<CardSmsClipboardDraft | null>(),
    [],
  );
  const readAvailableCardSmsClipboardDraft = useCallback(() => {
    const scope = clipboardScopeRef.current;
    if (!scope) return Promise.resolve(null);
    return clipboardReader(scope, () =>
      readCardSmsClipboardDraft({
        baseDate: new Date(),
        shouldIgnoreDraft: shouldIgnoreCardSmsClipboardDraft,
      }),
    );
  }, [clipboardReader, shouldIgnoreCardSmsClipboardDraft]);

  useEffect(() => {
    setClipboardSuggestionDraft(null);
    if (clipboardScope) pendingClipboardCheckRef.current = true;
  }, [clipboardScope]);
  useEffect(() => {
    clipboardDetectionMountedRef.current = true;
    return () => {
      clipboardDetectionMountedRef.current = false;
    };
  }, []);
  useEffect(() => {
    Keyboard.dismiss();
    setIsComposerVisible(false);
  }, [ledgerState.activeBook?.id]);

  const handleOpenCardSmsClipboardDraft = useCallback(
    (clipboardDraft: CardSmsClipboardDraft) => {
      if (ledgerState.isReadOnlyDueToPlanLimit) {
        handleReadOnlyEditBlocked();
        return;
      }

      const draftToEdit = buildCardSmsClipboardLedgerEntryDraft({
        clipboardDraft,
        fallbackDate: ledgerState.selectedDate,
        userId: userId,
      });
      lastHandledClipboardRef.current = JSON.stringify(clipboardDraft);
      setIsComposerVisible(true);
      entryComposerRef.current?.importDraft(draftToEdit);
    },
    [handleReadOnlyEditBlocked, ledgerState, userId],
  );

  const handleImportCardSmsClipboardDraft = useCallback(async () => {
    if (!isSignedInInteractionReady) {
      return;
    }

    const scope = clipboardScopeRef.current;
    if (!scope) return;
    const clipboardDraft = await readAvailableCardSmsClipboardDraft();
    if (scope !== clipboardScopeRef.current) return;
    if (!clipboardDraft) {
      setClipboardSuggestionDraft(null);
      navigateToEntryFromCalendar();
      return;
    }

    setClipboardSuggestionDraft(null);
    handleOpenCardSmsClipboardDraft(clipboardDraft);
  }, [
    handleOpenCardSmsClipboardDraft,
    isSignedInInteractionReady,
    navigateToEntryFromCalendar,
    readAvailableCardSmsClipboardDraft,
  ]);

  const handleOpenEntryFromCalendar = useCallback(async () => {
    if (!isSignedInInteractionReady) {
      return;
    }

    if (ledgerState.isReadOnlyDueToPlanLimit) {
      handleReadOnlyEditBlocked();
      return;
    }

    navigateToEntryFromCalendar();
    const scope = clipboardScopeRef.current;
    if (!scope) return;
    const clipboardDraft = await readAvailableCardSmsClipboardDraft();
    if (scope !== clipboardScopeRef.current) return;
    setClipboardSuggestionDraft(clipboardDraft);
  }, [
    handleReadOnlyEditBlocked,
    isSignedInInteractionReady,
    ledgerState.isReadOnlyDueToPlanLimit,
    navigateToEntryFromCalendar,
    readAvailableCardSmsClipboardDraft,
  ]);

  const handlePasteClipboardDraft = useCallback(async () => {
    const scope = clipboardScopeRef.current;
    if (!scope || clipboardPasteInFlightRef.current) return;
    clipboardPasteInFlightRef.current = true;
    try {
      const draft = await readAvailableCardSmsClipboardDraft();
      if (scope !== clipboardScopeRef.current || !composerVisibleRef.current) return;
      setClipboardSuggestionDraft(null);
      if (draft) handleOpenCardSmsClipboardDraft(draft);
      else showNativeToast(CardSmsClipboardCopy.noAvailableEntry);
    } finally {
      clipboardPasteInFlightRef.current = false;
    }
  }, [handleOpenCardSmsClipboardDraft, readAvailableCardSmsClipboardDraft]);

  const handleDetectClipboardSuggestion = useCallback(async () => {
    const scope = clipboardScopeRef.current;
    if (
      !scope ||
      AppState.currentState !== "active" ||
      !isSignedInInteractionReady ||
      ledgerState.isReadOnlyDueToPlanLimit ||
      navigationRef.getCurrentRoute()?.name === "entry-sheet" ||
      composerVisibleRef.current ||
      clipboardSuggestionDraft ||
      entryComposerRef.current?.isBusy() ||
      clipboardReadInFlightRef.current
    ) {
      return;
    }

    pendingClipboardCheckRef.current = false;
    clipboardReadInFlightRef.current = true;
    try {
      const clipboardDraft = await readAvailableCardSmsClipboardDraft();
      if (!clipboardDetectionMountedRef.current) return;
      if (AppState.currentState !== "active") {
        pendingClipboardCheckRef.current = true;
        return;
      }
      if (
        scope !== clipboardScopeRef.current ||
        !clipboardDraft ||
        entryComposerRef.current?.isBusy() ||
        JSON.stringify(clipboardDraft) === lastHandledClipboardRef.current
      )
        return;
      setClipboardSuggestionDraft(clipboardDraft);
    } finally {
      clipboardReadInFlightRef.current = false;
      if (
        clipboardDetectionMountedRef.current &&
        pendingClipboardCheckRef.current &&
        clipboardScopeRef.current &&
        AppState.currentState === "active"
      ) {
        setClipboardCheckRevision((revision) => revision + 1);
      }
    }
  }, [
    clipboardSuggestionDraft,
    isSignedInInteractionReady,
    ledgerState.isReadOnlyDueToPlanLimit,
    navigationRef,
    readAvailableCardSmsClipboardDraft,
  ]);

  useEffect(() => {
    if (
      !pendingClipboardCheckRef.current ||
      !clipboardScope ||
      !isSignedInInteractionReady ||
      AppState.currentState !== "active"
    ) {
      return;
    }

    void handleDetectClipboardSuggestion();
  }, [
    handleDetectClipboardSuggestion,
    isSignedInInteractionReady,
    clipboardScope,
    clipboardCheckRevision,
    isComposerPresented,
    isEntrySheetOpen,
  ]);

  useEffect(() => {
    if (isSignedInInteractionReady) {
      return;
    }

    setClipboardSuggestionDraft(null);
  }, [isSignedInInteractionReady]);

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener("change", (nextState) => {
      const previousState = previousClipboardImportAppStateRef.current;
      previousClipboardImportAppStateRef.current = nextState;

      if (previousState === "active" || nextState !== "active") {
        return;
      }

      pendingClipboardCheckRef.current = true;
      if (!isSignedInInteractionReady) return;
      void handleDetectClipboardSuggestion();
    });

    return () => {
      appStateSubscription.remove();
    };
  }, [handleDetectClipboardSuggestion, isSignedInInteractionReady]);

  const handleDismissClipboardSuggestion = useCallback(() => {
    if (clipboardSuggestionDraft)
      lastHandledClipboardRef.current = JSON.stringify(clipboardSuggestionDraft);
    setClipboardSuggestionDraft(null);
  }, [clipboardSuggestionDraft]);

  const handleApplyClipboardSuggestion = useCallback(() => {
    if (!clipboardSuggestionDraft) {
      return;
    }

    const clipboardDraft = clipboardSuggestionDraft;
    setClipboardSuggestionDraft(null);
    handleOpenCardSmsClipboardDraft(clipboardDraft);
  }, [clipboardSuggestionDraft, handleOpenCardSmsClipboardDraft]);

  const handleOpenClipboardImportFromWidget = useCallback(() => {
    void handleImportCardSmsClipboardDraft();
  }, [handleImportCardSmsClipboardDraft]);

  return {
    clipboardSuggestionDraft,
    handleOpenEntryFromCalendar,
    handlePasteClipboardDraft,
    handleDismissClipboardSuggestion,
    handleApplyClipboardSuggestion,
    handleOpenClipboardImportFromWidget,
  };
}

function buildCardSmsClipboardLedgerEntryDraft({
  clipboardDraft,
  fallbackDate,
  userId,
}: {
  clipboardDraft: CardSmsClipboardDraft;
  fallbackDate: string;
  userId: string;
}): LedgerEntryDraft {
  const draftDate = clipboardDraft.date ?? fallbackDate;

  return {
    ...createDraft(draftDate, userId),
    amount: clipboardDraft.amount,
    content: clipboardDraft.content,
    type: clipboardDraft.type,
  };
}
