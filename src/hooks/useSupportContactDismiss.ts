import { useNavigation, usePreventRemove } from "@react-navigation/native";
import { useRef } from "react";
import { Alert } from "react-native";
import { SupportContactCopy } from "../constants/supportContact";

export function useSupportContactDismiss(isDirty: boolean, isBusy: boolean) {
  const navigation = useNavigation();
  const confirming = useRef(false);
  usePreventRemove(isDirty || isBusy, ({ data }) => {
    if (isBusy || confirming.current) return;
    confirming.current = true;
    const release = () => {
      confirming.current = false;
    };
    Alert.alert(
      SupportContactCopy.discardTitle,
      SupportContactCopy.discardMessage,
      [
        { text: SupportContactCopy.continueAction, style: "cancel", onPress: release },
        {
          text: SupportContactCopy.discardAction,
          style: "destructive",
          onPress: () => {
            release();
            navigation.dispatch(data.action);
          },
        },
      ],
      { onDismiss: release },
    );
  });
}
