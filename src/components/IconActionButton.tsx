import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";

import { AuthControls } from "../constants/authControls";
import { AppColors } from "../constants/colors";

export const ICON_ACTION_BUTTON_SIZE = AuthControls.controlHeight;
export const ICON_ACTION_BUTTON_COMPACT_SIZE = 28;

type IconActionButtonProps = {
  accessibilityLabel?: string;
  disabled?: boolean;
  icon: keyof typeof Feather.glyphMap;
  isActive?: boolean;
  onPress: () => void;
  size?: "compact" | "default";
};

export function IconActionButton({
  accessibilityLabel,
  disabled = false,
  icon,
  isActive = false,
  onPress,
  size = "default",
}: IconActionButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        size === "compact" ? styles.compactButton : null,
        isActive && styles.activeButton,
        disabled && styles.disabledButton,
      ]}
    >
      <Feather
        color={isActive ? AppColors.primary : AppColors.mutedText}
        name={icon}
        size={size === "compact" ? 16 : 18}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: ICON_ACTION_BUTTON_SIZE,
    height: ICON_ACTION_BUTTON_SIZE,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: AuthControls.borderRadius,
  },
  compactButton: {
    width: ICON_ACTION_BUTTON_COMPACT_SIZE,
    height: ICON_ACTION_BUTTON_COMPACT_SIZE,
  },
  activeButton: {
    opacity: 1,
  },
  disabledButton: {
    opacity: 0.45,
  },
});
