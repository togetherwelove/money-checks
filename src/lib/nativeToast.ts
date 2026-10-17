import { Dimensions, Keyboard } from "react-native";
import type { ToastOptions } from "react-native-root-toast";

import { ToastUi } from "../constants/toast";

export function showNativeToast(message: string) {
  const RootToast = require("react-native-root-toast").default as {
    durations: { SHORT: number };
    show: (message: string, options: ToastOptions) => unknown;
  };
  const keyboard = Keyboard.metrics();
  // Android may already resize the window above the keyboard.
  const keyboardOverlap = keyboard
    ? Math.max(0, Math.min(keyboard.height, Dimensions.get("window").height - keyboard.screenY))
    : 0;

  RootToast.show(message, {
    animation: true,
    backgroundColor: ToastUi.backgroundColor,
    duration: RootToast.durations.SHORT,
    hideOnPress: true,
    keyboardAvoiding: false,
    opacity: ToastUi.opacity,
    position: -(keyboardOverlap + ToastUi.bottomOffset),
    shadow: false,
    textColor: ToastUi.textColor,
    textStyle: { fontSize: ToastUi.textSize },
  });
}
