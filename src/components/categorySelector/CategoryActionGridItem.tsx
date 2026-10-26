import { Feather } from "../AppIcons";
import { Pressable, StyleSheet } from "react-native";

import { AuthControls } from "../../constants/authControls";
import { CATEGORY_GRID_ACTION_ICON_SIZE } from "../../constants/categorySelector";
import { AppColors } from "../../constants/colors";

type CategoryActionGridItemProps = {
  icon: "edit-2";
  accessibilityLabel: string;
  cellSize: number;
  left: number;
  top: number;
  onPress: () => void;
};

export function CategoryActionGridItem({ icon, accessibilityLabel, cellSize, left, top, onPress }: CategoryActionGridItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          height: cellSize,
          left,
          top,
          width: cellSize,
        },
        pressed && styles.pressedButton,
      ]}
    >
      <Feather color={AppColors.primary} name={icon} size={CATEGORY_GRID_ACTION_ICON_SIZE} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressedButton: { backgroundColor: AppColors.surfaceMuted },
  button: {
    position: "absolute",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: AppColors.border,
    borderRadius: AuthControls.borderRadius,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.background,
  },
});
