import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";

import { AppColors } from "../constants/colors";
import { FooterTabBarUi, MenuCopy, MenuUi } from "../constants/menu";

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
        color={isOpen ? AppColors.primary : AppColors.mutedStrongText}
        name={isOpen ? "x" : "menu"}
        size={MenuUi.floatingButtonIconSize}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    top: MenuUi.floatingButtonInset,
    right: MenuUi.floatingButtonInset,
    zIndex: MenuUi.floatingButtonZIndex,
    elevation: FooterTabBarUi.barElevation,
    width: MenuUi.floatingButtonSize,
    height: MenuUi.floatingButtonSize,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: FooterTabBarUi.barBorderWidth,
    borderColor: AppColors.border,
    borderRadius: MenuUi.floatingButtonBorderRadius,
    backgroundColor: AppColors.capsuleSurface,
    shadowColor: AppColors.text,
    shadowOffset: {
      width: FooterTabBarUi.barShadowOffsetX,
      height: FooterTabBarUi.barShadowOffsetY,
    },
    shadowOpacity: FooterTabBarUi.barShadowOpacity,
    shadowRadius: FooterTabBarUi.barShadowRadius,
  },
  pressedButton: {
    opacity: MenuUi.floatingButtonPressedOpacity,
  },
});
