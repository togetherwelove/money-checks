import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";

import { CategoryCustomizerCopy } from "../../constants/categoryCustomizer";
import { AppColors } from "../../constants/colors";

type CategoryAddGridItemProps = {
  cellSize: number;
  left: number;
  top: number;
  onPress: () => void;
};

export function CategoryAddGridItem({ cellSize, left, top, onPress }: CategoryAddGridItemProps) {
  return (
    <Pressable
      accessibilityLabel={CategoryCustomizerCopy.addAccessibilityLabel}
      onPress={onPress}
      style={[
        styles.button,
        {
          height: cellSize,
          left,
          top,
          width: cellSize,
        },
      ]}
    >
      <Feather color={AppColors.primary} name="plus" size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: AppColors.border,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.background,
  },
});
