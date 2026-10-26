import * as Clipboard from "expo-clipboard";
import { Alert, Share } from "react-native";

import { ShareLedgerMessages as Copy } from "../constants/shareLedgerMessages";
import { logAppError } from "./logAppError";
import { showNativeToast } from "./nativeToast";

export async function copyLedgerShareCode(
  shareCode: string,
  beforeCopy: () => Promise<void> | void,
  isCurrent: () => boolean,
) {
  try {
    await beforeCopy();
  } catch (error) {
    logAppError("ShareLedgerCode", error, { step: "show_copy_ad" });
  }
  if (!isCurrent()) return;

  try {
    await Clipboard.setStringAsync(shareCode);
  } catch (error) {
    logAppError("ShareLedgerCode", error, { step: "copy_code" });
    if (isCurrent()) showNativeToast(Copy.copyCodeErrorToast);
    return;
  }
  if (!isCurrent()) return;
  showNativeToast(Copy.copyCodeSuccessToast);
  const shouldShare = await new Promise<boolean>(resolve => {
    Alert.alert(Copy.copyCodeSuccessToast, Copy.shareCodeQuestion, [
      { text: Copy.copyOnlyAction, style: "cancel", onPress: () => resolve(false) },
      { text: Copy.shareCodeAction, onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
  if (!shouldShare || !isCurrent()) return;

  try {
    await Share.share({ message: shareCode });
  } catch (error) {
    logAppError("ShareLedgerCode", error, { step: "share_code" });
    if (isCurrent()) showNativeToast(Copy.shareCodeErrorToast);
  }
}
