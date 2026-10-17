import { useEffect, useState } from "react";
import { Dimensions, Keyboard, type KeyboardEvent, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { appPlatform } from "../lib/appPlatform";

export function useComposerKeyboard() {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [keyboardHeight, setKeyboardHeight] = useState(() => Keyboard.metrics()?.height ?? 0);

  useEffect(() => {
    const updateFrame = (event: KeyboardEvent) => {
      Keyboard.scheduleLayoutAnimation(event);
      const screenHeight = Dimensions.get("screen").height;
      setKeyboardHeight(Math.max(0, Math.min(event.endCoordinates.height, screenHeight - event.endCoordinates.screenY)));
    };
    const hide = (event: KeyboardEvent) => {
      Keyboard.scheduleLayoutAnimation(event);
      setKeyboardHeight(0);
    };
    const subscriptions = appPlatform.isIOS
      ? [Keyboard.addListener("keyboardWillChangeFrame", updateFrame), Keyboard.addListener("keyboardWillHide", hide)]
      : [Keyboard.addListener("keyboardDidShow", updateFrame), Keyboard.addListener("keyboardDidHide", hide)];
    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, []);

  return {
    isVisible: keyboardHeight > 0,
    // Android resizes the app above the IME; only iOS has app content behind it.
    backdropHeight: appPlatform.isIOS ? keyboardHeight : 0,
    bottomInset: keyboardHeight > 0 ? 0 : insets.bottom,
    // The dock starts below the top safe area, while keyboard frames use screen coordinates.
    verticalOffset: insets.top,
    availableHeight: Math.max(0, windowHeight - insets.top - (appPlatform.isIOS ? keyboardHeight : 0)),
  };
}
