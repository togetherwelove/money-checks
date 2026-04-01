import { Pressable, StyleSheet, Text } from "react-native";

import { AppColors } from "../constants/colors";

type ActionButtonProps = {
  disabled?: boolean;
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "destructive";
};

export function ActionButton({
  disabled = false,
  label,
  onPress,
  variant = "secondary",
}: ActionButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, styles[`${variant}Button`], disabled ? styles.disabledButton : null]}
    >
      <Text style={[styles.text, styles[`${variant}Text`]]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  primaryButton: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primary,
  },
  secondaryButton: {
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
  },
  destructiveButton: {
    borderColor: AppColors.expense,
    backgroundColor: AppColors.surface,
  },
  disabledButton: {
    opacity: 0.45,
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
  },
  primaryText: {
    color: AppColors.inverseText,
  },
  secondaryText: {
    color: AppColors.primary,
  },
  destructiveText: {
    color: AppColors.expense,
  },
});
