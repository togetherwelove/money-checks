import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useLayoutEffect, useRef } from "react";
import type { SignedInStackParamList } from "../app/signedInNavigation";
import { getSupportContactSendOptions } from "../app/supportContactSheetOptions";
import { useAppTheme } from "./useAppTheme";

export function useSupportContactHeader(onSend: () => Promise<void>, canSend: boolean) {
  const navigation =
    useNavigation<NativeStackNavigationProp<SignedInStackParamList, "contact-support">>();
  const scheme = useAppTheme();
  const send = useRef(onSend);
  const enabled = useRef(canSend);
  send.current = onSend;
  enabled.current = canSend;
  const handleSend = useCallback(() => {
    if (enabled.current) void send.current();
  }, []);
  useLayoutEffect(() => {
    navigation.setOptions(getSupportContactSendOptions(handleSend, !canSend));
  }, [navigation, handleSend, canSend, scheme]);
}
