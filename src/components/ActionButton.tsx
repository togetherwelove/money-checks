import { AppFontSize } from "../constants/typography";
import { SettingsGroupDesign } from "../constants/settingsGroupStyles";
import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import type { ReactNode } from "react";
import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { ActionButtonLabelTextStyle } from "../constants/uiStyles";
import { AuthControls } from "../constants/authControls";
import { getAppColors } from "../constants/colors";
import { OneLineTextFitProps } from "../constants/textLayout";

type ActionButtonProps = {
  disabled?: boolean;
  dimWhenDisabled?: boolean;
  fullWidth?: boolean;
  shape?: "rounded" | "capsule";
  label: string;
  labelContent?: ReactNode;
  loading?: boolean;
  onPress: () => unknown;
  size?: "compact" | "inline" | "large";
  variant?: "primary" | "secondary" | "destructive";
};

export function ActionButton({
  disabled = false,
  dimWhenDisabled = true,
  fullWidth = false,
  shape = "rounded",
  label,
  labelContent = null,
  loading = false,
  onPress,
  size = "compact",
  variant = "secondary",
}: ActionButtonProps) {
  const styles = getStyles();
  useAppTheme();
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
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || isLoading, busy: isLoading }}
      disabled={disabled || isLoading}
      onPress={handlePress}
      style={[
        styles.button,
        styles[`${size}Button`],
        fullWidth ? styles.fullWidth : null,
        styles[`${variant}Button`],
        shape === "capsule" && styles.capsuleButton,
        shape === "capsule" && variant === "secondary" && styles.capsuleSecondaryButton,
        dimWhenDisabled && (disabled || isLoading) ? styles.disabledButton : null,
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

const getStyles = createThemeValue(() =>
  StyleSheet.create({
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
      borderRadius: AuthControls.borderRadius,
    },
    largeButton: {
      paddingHorizontal: AuthControls.horizontalPadding,
      paddingVertical: AuthControls.verticalPadding,
      borderRadius: AuthControls.borderRadius,
    },
    capsuleSecondaryButton: { backgroundColor: getAppColors().surface },
    capsuleButton: {
      minHeight: SettingsGroupDesign.singleLineHeight,
      paddingHorizontal: SettingsGroupDesign.horizontalPadding,
      borderRadius: SettingsGroupDesign.radius,
      paddingVertical: SettingsGroupDesign.rowVerticalPadding,
    },
    fullWidth: {
      flex: 1,
    },
    primaryButton: {
      borderColor: getAppColors().primary,
      backgroundColor: getAppColors().primary,
    },
    secondaryButton: {
      borderColor: getAppColors().border,
      backgroundColor: getAppColors().background,
    },
    destructiveButton: {
      borderColor: getAppColors().expense,
      backgroundColor: getAppColors().expenseSoft,
    },
    disabledButton: {
      opacity: 0.45,
    },
    text: {
      fontSize: AppFontSize.caption,
      fontWeight: "700",
    },
    compactText: ActionButtonLabelTextStyle,
    inlineText: {
      fontSize: AppFontSize.body,
    },
    largeText: ActionButtonLabelTextStyle,
    primaryText: {
      color: getAppColors().onPrimary,
    },
    secondaryText: {
      color: getAppColors().primary,
    },
    destructiveText: {
      color: getAppColors().expense,
    },
  }),
);
