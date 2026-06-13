import { ToastUi } from "../constants/toast";

export function showNativeToast(message: string) {
  const RootToast = require("react-native-root-toast").default as {
    durations: { SHORT: number };
    positions: { BOTTOM: number };
    show: (
      message: string,
      options: {
        animation: boolean;
        backgroundColor: string;
        bottomOffset: number;
        duration: number;
        hideOnPress: boolean;
        opacity: number;
        position: number;
        shadow: boolean;
        textColor: string;
        textSize: number;
      },
    ) => unknown;
  };

  RootToast.show(message, {
    animation: true,
    backgroundColor: ToastUi.backgroundColor,
    bottomOffset: ToastUi.bottomOffset,
    duration: RootToast.durations.SHORT,
    hideOnPress: true,
    opacity: ToastUi.opacity,
    position: RootToast.positions.BOTTOM,
    shadow: false,
    textColor: ToastUi.textColor,
    textSize: ToastUi.textSize,
  });
}
