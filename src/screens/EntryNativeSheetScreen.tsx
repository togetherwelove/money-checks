import { useNavigation, usePreventRemove } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";

import type { SignedInStackParamList } from "../app/signedInNavigation";
import { AppColors } from "../constants/colors";
import {
  EntryNativeSheetUi,
  EntryRegistrationCopy,
} from "../constants/entryRegistration";
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
  const { height: windowHeight } = useWindowDimensions();
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
  const closeForPendingSave = useCallback(() => {
    didCompleteRef.current = true;

    return new Promise<void>((resolve) => {
      const removeTransitionEndListener = navigation.addListener(
        "transitionEnd",
        ({ data }) => {
          if (!data.closing) {
            return;
          }

          removeTransitionEndListener();
          resolve();
        },
      );
      navigation.goBack();
    });
  }, [navigation]);
  const handleDraftChange = useCallback(() => {
    setIsDirty(true);
  }, []);

  const handleSaveEntry = useCallback(async () => {
    if (isSaving) {
      return;
    }

    const wasEditingEntry = Boolean(state.editingEntryId);
    setIsSaving(true);
    const didSaveEntry = await onSaveEntry();
    setIsSaving(false);

    if (didSaveEntry) {
      closeAfterCompletion();
      showNativeToast(
        wasEditingEntry
          ? EntryRegistrationCopy.saveUpdateSuccess
          : EntryRegistrationCopy.saveCreateSuccess,
      );
    }
  }, [closeAfterCompletion, isSaving, onSaveEntry, state.editingEntryId]);

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
    <View style={styles.overlay}>
      <Pressable
        accessibilityLabel={EntryRegistrationCopy.dismissAccessibilityLabel}
        accessibilityRole="button"
        onPress={() => navigation.goBack()}
        style={styles.backdrop}
      />
      <View
        style={[
          styles.sheet,
          { height: Math.round(windowHeight * EntryNativeSheetUi.detentRatio) },
        ]}
      >
        <View style={styles.grabber} />
        <EntryScreen
          autoFocusContent={autoFocusContent}
          currentUserId={currentUserId}
          isSaving={isSaving}
          onDraftChange={handleDraftChange}
          onSaveEntry={handleSaveEntry}
          onPrepayInstallmentEntry={handlePrepayInstallmentEntry}
          state={state}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: AppColors.overlay,
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: AppColors.screenBackground,
    borderTopLeftRadius: EntryNativeSheetUi.topRadius,
    borderTopRightRadius: EntryNativeSheetUi.topRadius,
    overflow: "hidden",
    width: "100%",
  },
  grabber: {
    alignSelf: "center",
    backgroundColor: AppColors.border,
    borderRadius: EntryNativeSheetUi.grabberHeight / 2,
    height: EntryNativeSheetUi.grabberHeight,
    marginTop: EntryNativeSheetUi.grabberTopMargin,
    width: EntryNativeSheetUi.grabberWidth,
  },
});
