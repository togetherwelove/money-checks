import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
  CATEGORY_CUSTOMIZER_HANDLE_SIZE,
  CATEGORY_CUSTOMIZER_ICON_BUTTON_SIZE,
  CATEGORY_CUSTOMIZER_ROW_HEIGHT,
  CategoryCustomizerCopy,
} from "../../constants/categoryCustomizer";
import { CATEGORY_DRAG_LONG_PRESS_MS } from "../../constants/categorySelector";
import { AppColors } from "../../constants/colors";
import { AppLayout } from "../../constants/layout";
import type { CategoryDefinition } from "../../types/category";

type CategoryCustomizerRowProps = {
  category: CategoryDefinition;
  isDragging: boolean;
  isIconPickerActive: boolean;
  onChangeLabel: (categoryId: string, label: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  onDrag: () => void;
  onOpenIconPicker: (categoryId: string) => void;
};

export function CategoryCustomizerRow({
  category,
  isDragging,
  isIconPickerActive,
  onChangeLabel,
  onDeleteCategory,
  onDrag,
  onOpenIconPicker,
}: CategoryCustomizerRowProps) {
  return (
    <View style={[styles.row, isDragging ? styles.draggingRow : null]}>
      <Pressable onPress={() => onOpenIconPicker(category.id)} style={styles.iconButton}>
        <View style={[styles.iconInner, isIconPickerActive ? styles.activeIconInner : null]}>
          <Feather
            color={isIconPickerActive ? AppColors.primary : AppColors.mutedText}
            name={category.iconName}
            size={18}
          />
        </View>
      </Pressable>
      {category.source === "custom" ? (
        <TextInput
          onChangeText={(value) => onChangeLabel(category.id, value)}
          placeholder={CategoryCustomizerCopy.namePlaceholder}
          style={styles.input}
          value={category.label}
        />
      ) : (
        <View style={styles.labelSlot}>
          <Text style={styles.labelText}>{category.label}</Text>
        </View>
      )}
      <Pressable
        accessibilityLabel={CategoryCustomizerCopy.deleteAccessibilityLabel}
        onPress={() => onDeleteCategory(category.id)}
        style={styles.deleteButton}
      >
        <Feather color={AppColors.expense} name="trash-2" size={16} />
      </Pressable>
      <Pressable
        accessibilityLabel={CategoryCustomizerCopy.reorderHandleAccessibilityLabel}
        delayLongPress={CATEGORY_DRAG_LONG_PRESS_MS}
        onLongPress={onDrag}
        style={styles.dragHandle}
      >
        <Feather color={AppColors.mutedText} name="menu" size={18} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: CATEGORY_CUSTOMIZER_ROW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: AppLayout.cardRadius,
    backgroundColor: AppColors.surface,
  },
  draggingRow: {
    borderColor: AppColors.accent,
    shadowColor: AppColors.calendarShadow,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  iconButton: {
    width: CATEGORY_CUSTOMIZER_ICON_BUTTON_SIZE,
    height: CATEGORY_CUSTOMIZER_ICON_BUTTON_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  iconInner: {
    width: CATEGORY_CUSTOMIZER_ICON_BUTTON_SIZE,
    height: CATEGORY_CUSTOMIZER_ICON_BUTTON_SIZE,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
  },
  activeIconInner: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.surfaceStrong,
  },
  input: {
    flex: 1,
    minHeight: CATEGORY_CUSTOMIZER_ROW_HEIGHT - 14,
    paddingHorizontal: 8,
    color: AppColors.text,
    fontSize: 15,
    fontWeight: "600",
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  labelSlot: {
    flex: 1,
    minHeight: CATEGORY_CUSTOMIZER_ROW_HEIGHT - 14,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  labelText: {
    color: AppColors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  deleteButton: {
    width: CATEGORY_CUSTOMIZER_HANDLE_SIZE,
    height: CATEGORY_CUSTOMIZER_HANDLE_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  dragHandle: {
    width: CATEGORY_CUSTOMIZER_HANDLE_SIZE,
    height: CATEGORY_CUSTOMIZER_HANDLE_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
});
