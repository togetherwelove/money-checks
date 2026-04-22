import { Alert } from "react-native";

import { SharedLedgerJoinConfirmationCopy } from "../constants/sharedLedgerJoinConfirmation";
import { appPlatform } from "./appPlatform";
import { fetchLedgerEntryDateBounds } from "./ledgerEntries";
import { logAppError } from "./logAppError";

export async function confirmSharedLedgerJoinWithExistingEntries(
  activeBookId: string | null,
): Promise<boolean> {
  if (!activeBookId) {
    return true;
  }

  try {
    const dateBounds = await fetchLedgerEntryDateBounds(activeBookId);
    if (!dateBounds) {
      return true;
    }

    if (appPlatform.isWeb) {
      return window.confirm(SharedLedgerJoinConfirmationCopy.message);
    }

    return new Promise<boolean>((resolve) => {
      Alert.alert(
        SharedLedgerJoinConfirmationCopy.title,
        SharedLedgerJoinConfirmationCopy.message,
        [
          {
            style: "cancel",
            text: SharedLedgerJoinConfirmationCopy.cancelAction,
            onPress: () => resolve(false),
          },
          {
            style: "destructive",
            text: SharedLedgerJoinConfirmationCopy.confirmAction,
            onPress: () => resolve(true),
          },
        ],
      );
    });
  } catch (error) {
    logAppError("SharedLedgerJoinConfirmation", error, {
      activeBookId,
      step: "check_existing_entries_before_join",
    });
    return true;
  }
}
