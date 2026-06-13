import { Pressable, StyleSheet, Text } from "react-native";

import { AppColors } from "../constants/colors";
import { AppTextBreakProps } from "../constants/textLayout";

type TextLinkButtonProps = {
  align?: "center" | "start";
  disabled?: boolean;
  label: string;
  onPress: () => void;
  tone?: "default" | "destructive";
};

export function TextLinkButton({
  align = "start",
  disabled = false,
  label,
  onPress,
  tone = "default",
}: TextLinkButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        align === "center" ? styles.centerButton : styles.button,
        disabled ? styles.disabledButton : null,
      ]}
    >
      <Text
        {...AppTextBreakProps}
        style={[styles.text, tone === "destructive" ? styles.destructiveText : null]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
  },
  centerButton: {
    alignSelf: "center",
  },
  disabledButton: {
    opacity: 0.45,
  },
  text: {
    color: AppColors.mutedText,
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  destructiveText: {
    color: AppColors.expense,
  },
});
