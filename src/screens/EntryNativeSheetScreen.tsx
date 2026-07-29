import { useNavigation, usePreventRemove } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

import type { SignedInStackParamList } from "../app/signedInNavigation";
import { EntryRegistrationCopy } from "../constants/entryRegistration";
import type { LedgerScreenState } from "../hooks/useLedgerScreenState";
import type { LedgerEntry } from "../types/ledger";
import { EntryScreen } from "./EntryScreen";

type EntryNativeSheetScreenProps = {
  currentUserId: string;
  onDiscard: () => void;
  onSaveEntry: () => Promise<boolean>;
  onSettleInstallmentEntry: (entry: LedgerEntry) => Promise<boolean>;
  state: LedgerScreenState;
};

export function EntryNativeSheetScreen({
  currentUserId,
  onDiscard,
  onSaveEntry,
  onSettleInstallmentEntry,
  state,
}: EntryNativeSheetScreenProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<SignedInStackParamList, "entry-sheet">>();
  const [isDirty, setIsDirty] = useState(false);
  const didCompleteRef = useRef(false);
  const onDiscardRef = useRef(onDiscard);
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

  const closeAfterCompletion = useCallback(() => {
    didCompleteRef.current = true;
    navigation.goBack();
  }, [navigation]);

  const handleSaveEntry = useCallback(async () => {
    if (await onSaveEntry()) {
      closeAfterCompletion();
    }
  }, [closeAfterCompletion, onSaveEntry]);

  const handleSettleInstallmentEntry = useCallback(
    async (entry: LedgerEntry) => {
      if (await onSettleInstallmentEntry(entry)) {
        closeAfterCompletion();
      }
    },
    [closeAfterCompletion, onSettleInstallmentEntry],
  );

  return (
    <EntryScreen
      currentUserId={currentUserId}
      onDraftChange={() => setIsDirty(true)}
      onSaveEntry={handleSaveEntry}
      onSettleInstallmentEntry={handleSettleInstallmentEntry}
      state={state}
    />
  );
}
