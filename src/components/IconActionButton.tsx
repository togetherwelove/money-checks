import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";

import { AppColors } from "../constants/colors";

type IconActionButtonProps = {
  icon: keyof typeof Feather.glyphMap;
  isActive?: boolean;
  onPress: () => void;
};

export function IconActionButton({ icon, isActive = false, onPress }: IconActionButtonProps) {
  return (
    <Pressable onPress={onPress} style={[styles.button, isActive && styles.activeButton]}>
      <Feather color={isActive ? AppColors.primary : AppColors.mutedText} name={icon} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  activeButton: {
    opacity: 1,
  },
});
