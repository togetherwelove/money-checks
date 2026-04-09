import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";

import { AuthControls } from "../constants/authControls";
import { AppColors } from "../constants/colors";

export const ICON_ACTION_BUTTON_SIZE = AuthControls.controlHeight;

type IconActionButtonProps = {
  accessibilityLabel?: string;
  icon: keyof typeof Feather.glyphMap;
  isActive?: boolean;
  onPress: () => void;
};

export function IconActionButton({
  accessibilityLabel,
  icon,
  isActive = false,
  onPress,
}: IconActionButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={[styles.button, isActive && styles.activeButton]}
    >
      <Feather color={isActive ? AppColors.primary : AppColors.mutedText} name={icon} size={18} />
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
  activeButton: {
    opacity: 1,
  },
});
