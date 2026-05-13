import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";

import {
  CATEGORY_ICON_LABEL_GAP,
  CATEGORY_ICON_SIZE,
  CATEGORY_ITEM_PADDING_HORIZONTAL,
  CATEGORY_ITEM_PADDING_VERTICAL,
} from "../../constants/categorySelector";
import { AppColors } from "../../constants/colors";
import type { CategoryDefinition } from "../../types/category";

type CategoryGridItemProps = {
  category: CategoryDefinition;
  cellSize: number;
  isActive: boolean;
  left: number;
  onLongPressCategory: (category: CategoryDefinition) => void;
  onPressCategory: (category: CategoryDefinition) => void;
  top: number;
};

export function CategoryGridItem({
  category,
  cellSize,
  isActive,
  left,
  onLongPressCategory,
  onPressCategory,
  top,
}: CategoryGridItemProps) {
  return (
    <Pressable
      onLongPress={() => onLongPressCategory(category)}
      onPress={() => onPressCategory(category)}
      style={[
        styles.option,
        isActive && styles.activeOption,
        {
          height: cellSize,
          left,
          top,
          width: cellSize,
        },
      ]}
    >
      <Feather
        color={isActive ? AppColors.primary : AppColors.mutedText}
        name={category.iconName}
        size={CATEGORY_ICON_SIZE}
      />
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.86}
        numberOfLines={2}
        style={[styles.optionText, isActive && styles.activeOptionText]}
      >
        {category.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    position: "absolute",
    paddingHorizontal: CATEGORY_ITEM_PADDING_HORIZONTAL,
    paddingVertical: CATEGORY_ITEM_PADDING_VERTICAL,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 16,
    backgroundColor: AppColors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: CATEGORY_ICON_LABEL_GAP,
  },
  optionText: {
    color: AppColors.text,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  activeOption: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.surfaceStrong,
  },
  activeOptionText: {
    color: AppColors.primary,
    fontWeight: "700",
  },
});
