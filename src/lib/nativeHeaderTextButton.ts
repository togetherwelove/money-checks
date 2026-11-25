import type { NativeStackHeaderItemButton } from "@react-navigation/native-stack";

export function createNativeHeaderTextButton({
  label,
  accessibilityLabel = label,
  tintColor,
  disabled,
  onPress,
}: {
  label: string;
  accessibilityLabel?: string;
  tintColor: NativeStackHeaderItemButton["tintColor"];
  disabled: boolean;
  onPress: () => void;
}): NativeStackHeaderItemButton {
  return {
    type: "button",
    label,
    accessibilityLabel,
    variant: "plain",
    hidesSharedBackground: false,
    sharesBackground: false,
    tintColor,
    disabled,
    onPress: () => {
      if (!disabled) onPress();
    },
  };
}
