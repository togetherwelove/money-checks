import { Pressable, StyleSheet, Text } from "react-native";

import { AppColors } from "../constants/colors";
import { AppTextBreakProps } from "../constants/textLayout";

type TextLinkButtonProps = {
  align?: "center" | "start";
  label: string;
  onPress: () => void;
  tone?: "default" | "destructive";
};

export function TextLinkButton({
  align = "start",
  label,
  onPress,
  tone = "default",
}: TextLinkButtonProps) {
  return (
    <Pressable onPress={onPress} style={align === "center" ? styles.centerButton : styles.button}>
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
