import type { CategoryIconName } from "../types/category";
import { Feather } from "./AppIcons";
import type { ReactNode } from "react";
import { Pressable, type PressableProps, StyleSheet } from "react-native";

import { AuthControls } from "../constants/authControls";
import { AppColors } from "../constants/colors";

export const ICON_ACTION_BUTTON_SIZE = AuthControls.controlHeight;
export const ICON_ACTION_BUTTON_COMPACT_SIZE = 28;

type IconActionButtonProps = {
  accessibilityLabel?: string;
  disabled?: boolean;
  dimWhenDisabled?: boolean;
  hitSlop?: PressableProps["hitSlop"];
  icon: CategoryIconName;
  iconContent?: ReactNode;
  isActive?: boolean;
  onPress: () => void;
  size?: "compact" | "default";
};

export function IconActionButton({
  accessibilityLabel,
  disabled = false,
  dimWhenDisabled = true,
  hitSlop,
  icon,
  iconContent,
  isActive = false,
  onPress,
  size = "default",
}: IconActionButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={onPress}
      style={[
        styles.button,
        size === "compact" ? styles.compactButton : null,
        isActive && styles.activeButton,
        disabled && dimWhenDisabled && styles.disabledButton,
      ]}
    >
      {iconContent ?? <Feather
        color={isActive ? AppColors.primary : AppColors.mutedText}
        name={icon}
        size={size === "compact" ? 16 : 18}
      />}
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
