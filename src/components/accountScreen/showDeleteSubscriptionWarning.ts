import { Alert } from "react-native";
import { AccountDeletionSubscriptionCopy as Copy } from "../../constants/accountDeletion";

export function showDeleteSubscriptionWarning(onManage: () => void, onContinue: () => void) {
  Alert.alert(Copy.title, Copy.message, [
    { text: Copy.cancel, style: "cancel" },
    { text: Copy.manage, onPress: onManage },
    { text: Copy.continue, style: "destructive", onPress: onContinue },
  ], { cancelable: true });
}
