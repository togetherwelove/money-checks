import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";

import { AppColors } from "../constants/colors";
import { NavigationCopy } from "../constants/navigation";

type BackActionButtonProps = {
  onPress: () => void;
};

export function BackActionButton({ onPress }: BackActionButtonProps) {
  return (
    <Pressable
      accessibilityLabel={NavigationCopy.backActionAccessibilityLabel}
      onPress={onPress}
      style={styles.button}
    >
      <Feather color={AppColors.primary} name="arrow-left" size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
});
