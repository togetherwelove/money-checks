import { Feather } from "@expo/vector-icons";
import { View, StyleSheet, Text } from "react-native";

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
  // onPressCategory: (category: CategoryDefinition) => void;
};

export function CategoryGridItem({
  category,
  cellSize,
  isActive,
  // onPressCategory,
}: CategoryGridItemProps) {
  return (
    <View
      // onPointerUp={() => onPressCategory(category)}
      style={[
        styles.option,
        isActive && styles.activeOption,
        {
          height: cellSize,
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
    </View>
  );
}

const styles = StyleSheet.create({
  option: {
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
