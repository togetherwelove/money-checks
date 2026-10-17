import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";

import { AppColors } from "../constants/colors";
import { MenuCopy, MenuUi } from "../constants/menu";

type AppFloatingMenuButtonProps = {
  isOpen: boolean;
  onPress: () => void;
};

export function AppFloatingMenuButton({ isOpen, onPress }: AppFloatingMenuButtonProps) {
  return (
    <Pressable
      accessibilityLabel={
        isOpen ? MenuCopy.closeAccessibilityLabel : MenuCopy.openAccessibilityLabel
      }
      accessibilityRole="button"
      hitSlop={MenuUi.floatingButtonHitSlop}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed ? styles.pressedButton : null,
      ]}
    >
      <Feather
        color={isOpen ? AppColors.primary : AppColors.mutedText}
        name={isOpen ? "x" : "menu"}
        size={MenuUi.floatingButtonIconSize}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    top: MenuUi.floatingButtonVerticalInset,
    right: MenuUi.floatingButtonInset,
    zIndex: MenuUi.floatingButtonZIndex,
    width: MenuUi.floatingButtonSize,
    height: MenuUi.floatingButtonSize,
    alignItems: "center",
    justifyContent: "center",
  },
  pressedButton: {
    opacity: MenuUi.floatingButtonPressedOpacity,
  },
});
