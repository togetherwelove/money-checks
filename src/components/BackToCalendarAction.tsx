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
      <Feather color={AppColors.primary} name="arrow-left" size={16} />
      <Text style={styles.label}>{AppMessages.backToCalendarAction}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  label: {
    color: AppColors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
});
