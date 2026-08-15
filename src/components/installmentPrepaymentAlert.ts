import { Alert } from "react-native";

import {
  buildInstallmentPrepaymentConfirmMessage,
  EntryRegistrationCopy,
} from "../constants/entryRegistration";
import { AppMessages } from "../constants/messages";
import type { InstallmentPrepaymentPreview } from "../types/installmentTransactions";
import { formatCurrency } from "../utils/calendar";

export function confirmInstallmentPrepayment(
  preview: InstallmentPrepaymentPreview,
): Promise<boolean> {
  return new Promise((resolve) => {
    let isResolved = false;
    const settle = (confirmed: boolean) => {
      if (isResolved) {
        return;
      }

      isResolved = true;
      resolve(confirmed);
    };

    Alert.alert(
      EntryRegistrationCopy.installmentPrepaymentAction,
      buildInstallmentPrepaymentConfirmMessage(
        preview.installmentCount,
        formatCurrency(preview.totalAmount),
      ),
      [
        {
          onPress: () => settle(false),
          style: "cancel",
          text: AppMessages.editorDeleteCancelAction,
        },
        {
          onPress: () => settle(true),
          text: EntryRegistrationCopy.installmentPrepaymentConfirmAction,
        },
      ],
      {
        cancelable: true,
        onDismiss: () => settle(false),
      },
    );
  });
}
