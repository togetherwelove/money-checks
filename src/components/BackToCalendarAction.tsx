import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";

import { AppColors } from "../constants/colors";
import { AppMessages } from "../constants/messages";

type BackToCalendarActionProps = {
  onPress: () => void;
};

export function BackToCalendarAction({ onPress }: BackToCalendarActionProps) {
  return (
    <Pressable onPress={onPress} style={styles.button}>
      <Feather color={AppColors.primary} name="arrow-left" size={18} />
      <Text style={styles.label}>{AppMessages.backToCalendarAction}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  label: {
    color: AppColors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
});
