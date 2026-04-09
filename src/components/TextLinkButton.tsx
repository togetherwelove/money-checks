import { Pressable, StyleSheet, Text } from "react-native";

import { AppColors } from "../constants/colors";

type TextLinkButtonProps = {
  label: string;
  onPress: () => void;
  tone?: "default" | "destructive";
};

export function TextLinkButton({ label, onPress, tone = "default" }: TextLinkButtonProps) {
  return (
    <Pressable onPress={onPress} style={styles.button}>
      <Text style={[styles.text, tone === "destructive" ? styles.destructiveText : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
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
