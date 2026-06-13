import type { ReactNode } from "react";
import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { AuthControls } from "../constants/authControls";
import { AppColors } from "../constants/colors";
import { OneLineTextFitProps } from "../constants/textLayout";

type ActionButtonProps = {
  disabled?: boolean;
  fullWidth?: boolean;
  label: string;
  labelContent?: ReactNode;
  loading?: boolean;
  onPress: () => unknown;
  size?: "compact" | "inline" | "large";
  variant?: "primary" | "secondary" | "destructive";
};

export function ActionButton({
  disabled = false,
  fullWidth = false,
  label,
  labelContent = null,
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
      {labelContent ? (
        labelContent
      ) : (
        <Text
          {...OneLineTextFitProps}
          style={[styles.text, styles[`${size}Text`], styles[`${variant}Text`]]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: AuthControls.controlHeight,
    paddingHorizontal: AuthControls.horizontalPadding,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  compactButton: {
    paddingVertical: AuthControls.verticalPadding,
    borderRadius: AuthControls.borderRadius,
  },
  inlineButton: {
    minHeight: AuthControls.inlineControlHeight,
    paddingHorizontal: AuthControls.inlineHorizontalPadding,
    paddingVertical: AuthControls.inlineVerticalPadding,
    borderRadius: 10,
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
    backgroundColor: AppColors.background,
  },
  destructiveButton: {
    borderColor: AppColors.expense,
    backgroundColor: AppColors.expenseSoft,
  },
  disabledButton: {
    opacity: 0.45,
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
  },
  compactText: {
    fontSize: 15,
  },
  inlineText: {
    fontSize: 13,
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
