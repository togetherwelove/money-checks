import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { AuthControls } from "../constants/authControls";
import { AppColors } from "../constants/colors";

type ActionButtonProps = {
  disabled?: boolean;
  fullWidth?: boolean;
  label: string;
  loading?: boolean;
  onPress: () => unknown;
  size?: "compact" | "large";
  variant?: "primary" | "secondary" | "destructive";
};

export function ActionButton({
  disabled = false,
  fullWidth = false,
  label,
  loading = false,
  onPress,
  size = "compact",
  variant = "secondary",
}: ActionButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLoading = loading || isSubmitting;

  const handlePress = () => {
    if (isLoading || disabled) {
      return;
    }

    try {
      const maybePromise = onPress();
      if (
        maybePromise &&
        typeof maybePromise === "object" &&
        "finally" in maybePromise &&
        typeof maybePromise.finally === "function"
      ) {
        setIsSubmitting(true);
        void maybePromise.finally(() => {
          setIsSubmitting(false);
        });
      }
    } catch (error) {
      setIsSubmitting(false);
      throw error;
    }
  };

  return (
    <Pressable
      disabled={disabled || isLoading}
      onPress={handlePress}
      style={[
        styles.button,
        styles[`${size}Button`],
        fullWidth ? styles.fullWidth : null,
        styles[`${variant}Button`],
        disabled || isLoading ? styles.disabledButton : null,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={styles[`${variant}Text`].color} size="small" />
      ) : (
        <Text style={[styles.text, styles[`${size}Text`], styles[`${variant}Text`]]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  compactButton: {
    paddingVertical: 8,
    borderRadius: 999,
  },
  largeButton: {
    paddingHorizontal: AuthControls.horizontalPadding,
    paddingVertical: AuthControls.verticalPadding,
    borderRadius: AuthControls.borderRadius,
  },
  fullWidth: {
    flex: 1,
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
  compactText: {
    fontSize: 12,
  },
  largeText: {
    fontSize: 15,
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
