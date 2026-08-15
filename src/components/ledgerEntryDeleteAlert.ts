import { Alert } from "react-native";

import { InstallmentStatuses } from "../constants/installments";
import { AppMessages } from "../constants/messages";
import type { LedgerEntry } from "../types/ledger";
import {
  LedgerEntryDeleteScopes,
  type LedgerEntryDeleteScope,
} from "../types/ledgerEntryDeletion";

type ConfirmLedgerEntryDelete = (
  entry: LedgerEntry,
  scope: LedgerEntryDeleteScope,
) => unknown;

export function showLedgerEntryDeleteAlert(
  entry: LedgerEntry,
  onConfirmDelete: ConfirmLedgerEntryDelete,
) {
  if (!entry.installmentGroupId) {
    Alert.alert(
      AppMessages.editorDeleteConfirmTitle,
      AppMessages.editorDeleteConfirmMessage,
      [
        {
          style: "cancel",
          text: AppMessages.editorDeleteCancelAction,
        },
        {
          onPress: () => {
            void onConfirmDelete(entry, LedgerEntryDeleteScopes.single);
          },
          style: "destructive",
          text: AppMessages.editorDeleteConfirmAction,
        },
      ],
    );
    return;
  }

  if (entry.installmentStatus === InstallmentStatuses.prepaid) {
    Alert.alert(
      AppMessages.editorInstallmentDeleteConfirmTitle,
      AppMessages.editorPrepaidInstallmentDeleteConfirmMessage,
      [
        {
          onPress: () => {
            void onConfirmDelete(entry, LedgerEntryDeleteScopes.installmentGroup);
          },
          style: "destructive",
          text: AppMessages.editorPrepaidInstallmentDeleteAction,
        },
        {
          style: "cancel",
          text: AppMessages.editorDeleteCancelAction,
        },
      ],
    );
    return;
  }

  Alert.alert(
    AppMessages.editorInstallmentDeleteConfirmTitle,
    AppMessages.editorInstallmentDeleteConfirmMessage,
    [
      {
        onPress: () => {
          void onConfirmDelete(entry, LedgerEntryDeleteScopes.single);
        },
        text: AppMessages.editorInstallmentDeleteSingleAction,
      },
      {
        onPress: () => {
          void onConfirmDelete(entry, LedgerEntryDeleteScopes.installmentGroup);
        },
        style: "destructive",
        text: AppMessages.editorInstallmentDeleteAllAction,
      },
      {
        style: "cancel",
        text: AppMessages.editorDeleteCancelAction,
      },
    ],
  );
}
