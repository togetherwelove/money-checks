import { createThemeValue } from "../../lib/appTheme";
import { useAppTheme } from "../../hooks/useAppTheme";
import { Feather } from "../AppIcons";
import { View, StyleSheet, Text } from "react-native";

import {
  CATEGORY_ICON_LABEL_GAP,
  CATEGORY_ICON_SIZE,
  CATEGORY_ITEM_PADDING_HORIZONTAL,
  CATEGORY_ITEM_PADDING_VERTICAL,
} from "../../constants/categorySelector";
import { AuthControls } from "../../constants/authControls";
import { getAppColors } from "../../constants/colors";
import { CompactTextProps } from "../../constants/textLayout";
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
  const styles = getStyles();
  useAppTheme();
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
        color={isActive ? getAppColors().primary : getAppColors().mutedText}
        name={category.iconName}
        size={CATEGORY_ICON_SIZE}
      />
      <Text
        {...CompactTextProps}
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

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    option: {
      paddingHorizontal: CATEGORY_ITEM_PADDING_HORIZONTAL,
      paddingVertical: CATEGORY_ITEM_PADDING_VERTICAL,
      borderWidth: 1,
      borderColor: getAppColors().border,
      borderRadius: AuthControls.borderRadius,
      backgroundColor: getAppColors().surface,
      alignItems: "center",
      justifyContent: "center",
      gap: CATEGORY_ICON_LABEL_GAP,
    },
    optionText: {
      color: getAppColors().text,
      fontSize: 12,
      fontWeight: "600",
      textAlign: "center",
    },
    activeOption: {
      borderColor: getAppColors().primary,
      backgroundColor: getAppColors().surfaceStrong,
    },
    activeOptionText: {
      color: getAppColors().primary,
      fontWeight: "700",
    },
  }),
);
