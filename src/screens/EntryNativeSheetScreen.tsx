import { useNavigation, usePreventRemove } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

import type { SignedInStackParamList } from "../app/signedInNavigation";
import { EntryRegistrationCopy } from "../constants/entryRegistration";
import type { LedgerScreenState } from "../hooks/useLedgerScreenState";
import { showNativeToast } from "../lib/nativeToast";
import type { LedgerEntry } from "../types/ledger";
import type { InstallmentPrepaymentHandler } from "../types/installmentTransactions";
import { EntryScreen } from "./EntryScreen";

type EntryNativeSheetScreenProps = {
  autoFocusContent?: boolean;
  currentUserId: string;
  onDiscard: () => void;
  onSaveEntry: () => Promise<boolean>;
  onPrepayInstallmentEntry: InstallmentPrepaymentHandler;
  state: LedgerScreenState;
};

export function EntryNativeSheetScreen({
  autoFocusContent = false,
  currentUserId,
  onDiscard,
  onSaveEntry,
  onPrepayInstallmentEntry,
  state,
}: EntryNativeSheetScreenProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<SignedInStackParamList, "entry-sheet">>();
  const [isDirty, setIsDirty] = useState(false);
  const didCompleteRef = useRef(false);
  const onDiscardRef = useRef(onDiscard);
  const pendingSaveSuccessMessageRef = useRef<string | null>(null);
  onDiscardRef.current = onDiscard;

  usePreventRemove(isDirty, ({ data }) => {
    if (didCompleteRef.current) {
      navigation.dispatch(data.action);
      return;
    }

    Alert.alert(
      EntryRegistrationCopy.discardChangesTitle,
      EntryRegistrationCopy.discardChangesMessage,
      [
        {
          style: "cancel",
          text: EntryRegistrationCopy.discardChangesCancelAction,
        },
        {
          onPress: () => navigation.dispatch(data.action),
          style: "destructive",
          text: EntryRegistrationCopy.discardChangesConfirmAction,
        },
      ],
    );
  });

  useEffect(
    () => () => {
      if (!didCompleteRef.current) {
        onDiscardRef.current();
      }
    },
    [],
  );

  useEffect(
    () =>
      navigation.addListener("transitionEnd", ({ data }) => {
        const successMessage = pendingSaveSuccessMessageRef.current;
        if (!data.closing || !successMessage) {
          return;
        }

        pendingSaveSuccessMessageRef.current = null;
        showNativeToast(successMessage);
      }),
    [navigation],
  );

  const closeAfterCompletion = useCallback(() => {
    didCompleteRef.current = true;
    navigation.goBack();
  }, [navigation]);
  const handleDraftChange = useCallback(() => {
    setIsDirty(true);
  }, []);

  const handleSaveEntry = useCallback(async () => {
    const wasEditingEntry = Boolean(state.editingEntryId);
    if (!(await onSaveEntry())) {
      return;
    }

    pendingSaveSuccessMessageRef.current = wasEditingEntry
      ? EntryRegistrationCopy.saveUpdateSuccess
      : EntryRegistrationCopy.saveCreateSuccess;
    closeAfterCompletion();
  }, [closeAfterCompletion, onSaveEntry, state.editingEntryId]);

  const handlePrepayInstallmentEntry = useCallback(
    async (entry: LedgerEntry) => {
      const didPrepay = await onPrepayInstallmentEntry(entry);
      if (didPrepay) {
        closeAfterCompletion();
      }
      return didPrepay;
    },
    [closeAfterCompletion, onPrepayInstallmentEntry],
  );

  return (
    <EntryScreen
      autoFocusContent={autoFocusContent}
      currentUserId={currentUserId}
      onDraftChange={handleDraftChange}
      onSaveEntry={handleSaveEntry}
      onPrepayInstallmentEntry={handlePrepayInstallmentEntry}
      state={state}
    />
  );
}
