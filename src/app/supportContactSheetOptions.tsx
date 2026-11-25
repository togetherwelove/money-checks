import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { IconActionButton } from "../components/IconActionButton";
import { getAppColors } from "../constants/colors";
import { SupportContactCopy } from "../constants/supportContact";

export function getSupportContactSheetOptions(onClose: () => void): NativeStackNavigationOptions {
  return {
    presentation: "formSheet",
    animation: "slide_from_bottom",
    sheetGrabberVisible: true,
    headerBackVisible: false,
    headerLeft: () => (
      <IconActionButton
        icon="x"
        accessibilityLabel={SupportContactCopy.closeAction}
        onPress={onClose}
      />
    ),
    unstable_headerLeftItems: () => [
      {
        type: "button",
        label: SupportContactCopy.closeAction,
        accessibilityLabel: SupportContactCopy.closeAction,
        icon: { type: "sfSymbol", name: "xmark" },
        tintColor: getAppColors().text,
        onPress: onClose,
      },
    ],
  };
}

export function getSupportContactSendOptions(
  onSend: () => void,
  disabled: boolean,
): NativeStackNavigationOptions {
  const handleSend = () => {
    if (!disabled) onSend();
  };
  return {
    headerRight: () => (
      <IconActionButton
        icon="check"
        accessibilityLabel={SupportContactCopy.sendAction}
        disabled={disabled}
        onPress={handleSend}
      />
    ),
    unstable_headerRightItems: () => [
      {
        type: "button",
        label: SupportContactCopy.sendAction,
        accessibilityLabel: SupportContactCopy.sendAction,
        icon: { type: "sfSymbol", name: "checkmark" },
        variant: "prominent",
        tintColor: getAppColors().primary,
        disabled,
        onPress: handleSend,
      },
    ],
  };
}
