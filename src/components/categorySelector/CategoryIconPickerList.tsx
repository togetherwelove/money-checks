import { Feather } from "@expo/vector-icons";
import { type DimensionValue, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { CATEGORY_ICON_PICKER_OPTIONS } from "../../constants/categories";
import {
  CATEGORY_INLINE_ICON_PICKER_ARROW_SIZE,
  CATEGORY_INLINE_ICON_PICKER_COLUMNS,
  CATEGORY_INLINE_ICON_PICKER_GAP,
  CATEGORY_INLINE_ICON_PICKER_HEIGHT,
  CATEGORY_INLINE_ICON_PICKER_ITEM_SIZE,
  CATEGORY_INLINE_ICON_PICKER_PADDING,
} from "../../constants/categorySelector";
import { AppColors } from "../../constants/colors";
import type { CategoryIconName } from "../../types/category";

type CategoryIconPickerListProps = {
  activeIconName: CategoryIconName;
  arrowLeft: number;
  left: number;
  top: number;
  width: DimensionValue;
  onPressIn: () => void;
  onSelectIcon: (iconName: CategoryIconName) => void;
};

export function CategoryIconPickerList({
  activeIconName,
  arrowLeft,
  left,
  top,
  width,
  onPressIn,
  onSelectIcon,
}: CategoryIconPickerListProps) {
  return (
    <>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        onTouchStart={onPressIn}
        showsVerticalScrollIndicator={false}
        style={[styles.container, { left, top, width }]}
        contentContainerStyle={styles.content}
      >
        {chunkIconOptions().map((row) => (
          <View key={row.join("-")} style={styles.iconRow}>
            {row.map((iconName) => (
              <Pressable
                key={iconName}
                onPress={() => onSelectIcon(iconName)}
                onPressIn={onPressIn}
                style={[styles.iconButton, activeIconName === iconName && styles.activeIconButton]}
              >
                <Feather
                  color={activeIconName === iconName ? AppColors.primary : AppColors.mutedText}
                  name={iconName}
                  size={18}
                />
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
      <Pressable
        onPressIn={onPressIn}
        pointerEvents="none"
        style={[
          styles.arrowBorder,
          {
            left: left + arrowLeft - 1,
            top: top + CATEGORY_INLINE_ICON_PICKER_HEIGHT - 1,
          },
        ]}
      />
      <Pressable
        onPressIn={onPressIn}
        pointerEvents="none"
        style={[
          styles.arrowFill,
          { left: left + arrowLeft, top: top + CATEGORY_INLINE_ICON_PICKER_HEIGHT - 2 },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    height: CATEGORY_INLINE_ICON_PICKER_HEIGHT,
    zIndex: 4,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 16,
    backgroundColor: AppColors.surface,
  },
  content: {
    gap: CATEGORY_INLINE_ICON_PICKER_GAP,
    paddingHorizontal: CATEGORY_INLINE_ICON_PICKER_PADDING,
    paddingVertical: CATEGORY_INLINE_ICON_PICKER_PADDING,
  },
  iconRow: {
    flexDirection: "row",
    gap: CATEGORY_INLINE_ICON_PICKER_GAP,
  },
  iconButton: {
    width: CATEGORY_INLINE_ICON_PICKER_ITEM_SIZE,
    height: CATEGORY_INLINE_ICON_PICKER_ITEM_SIZE,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
  },
  activeIconButton: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.surfaceStrong,
  },
  arrowBorder: {
    position: "absolute",
    zIndex: 4,
    width: 0,
    height: 0,
    borderLeftWidth: CATEGORY_INLINE_ICON_PICKER_ARROW_SIZE + 1,
    borderRightWidth: CATEGORY_INLINE_ICON_PICKER_ARROW_SIZE + 1,
    borderTopWidth: CATEGORY_INLINE_ICON_PICKER_ARROW_SIZE + 1,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: AppColors.border,
  },
  arrowFill: {
    position: "absolute",
    zIndex: 5,
    width: 0,
    height: 0,
    borderLeftWidth: CATEGORY_INLINE_ICON_PICKER_ARROW_SIZE,
    borderRightWidth: CATEGORY_INLINE_ICON_PICKER_ARROW_SIZE,
    borderTopWidth: CATEGORY_INLINE_ICON_PICKER_ARROW_SIZE,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: AppColors.surface,
  },
});

function chunkIconOptions() {
  const rows = [];

  for (
    let index = 0;
    index < CATEGORY_ICON_PICKER_OPTIONS.length;
    index += CATEGORY_INLINE_ICON_PICKER_COLUMNS
  ) {
    rows.push(
      CATEGORY_ICON_PICKER_OPTIONS.slice(index, index + CATEGORY_INLINE_ICON_PICKER_COLUMNS),
    );
  }

  return rows;
}
