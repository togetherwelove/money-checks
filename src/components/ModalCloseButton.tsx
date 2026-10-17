import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";
import { AppColors } from "../constants/colors";
import { ModalCloseButtonUi as Ui } from "../constants/modal";

export function ModalCloseButton({
  onPress,
  disabled = false,
}: {
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={Ui.accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Feather name="x" size={Ui.iconSize} color={AppColors.mutedStrongText} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: Ui.touchSize,
    height: Ui.touchSize,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: Ui.pressedOpacity },
  disabled: { opacity: Ui.disabledOpacity },
});
