import { Feather } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { CategoryCustomizerCopy } from "../../constants/categoryCustomizer";
import {
  CATEGORY_MANAGE_ACTION_BUTTON_HEIGHT,
  CATEGORY_MANAGE_MODAL_MAX_HEIGHT,
  CATEGORY_MANAGE_MOVE_BUTTON_ICON_SIZE,
  CATEGORY_MANAGE_ROW_GAP,
  CATEGORY_MANAGE_ROW_HEIGHT,
  CATEGORY_MANAGE_ROW_ICON_SIZE,
} from "../../constants/categorySelector";
import { AppColors } from "../../constants/colors";
import { CommonActionCopy } from "../../constants/commonActions";
import { AppLayout } from "../../constants/layout";
import type { CategoryDefinition } from "../../types/category";

type CategoryManageModalProps = {
  categories: readonly CategoryDefinition[];
  isOpen: boolean;
  onClose: () => void;
  onChangeOrder: (categories: CategoryDefinition[]) => void;
};

export function CategoryManageModal({
  categories,
  isOpen,
  onClose,
  onChangeOrder,
}: CategoryManageModalProps) {
  const [orderedCategories, setOrderedCategories] = useState<CategoryDefinition[]>(() => [
    ...categories,
  ]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    categories[0]?.id ?? null,
  );
  const listScrollRef = useRef<ScrollView | null>(null);
  const listViewportHeightRef = useRef(0);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      return;
    }
    if (wasOpenRef.current) {
      return;
    }
    wasOpenRef.current = true;

    const nextCategories = [...categories];

    setOrderedCategories(nextCategories);
    setSelectedCategoryId((currentCategoryId) =>
      nextCategories.some((category) => category.id === currentCategoryId)
        ? currentCategoryId
        : (nextCategories[0]?.id ?? null),
    );
  }, [categories, isOpen]);

  const selectedIndex = orderedCategories.findIndex(
    (category) => category.id === selectedCategoryId,
  );
  const canMoveUp = selectedIndex > 0;
  const canMoveDown = selectedIndex >= 0 && selectedIndex < orderedCategories.length - 1;
  const canSave = !areCategoryOrdersEqual(categories, orderedCategories);

  const moveSelectedCategory = useCallback(
    (direction: -1 | 1) => {
      if (selectedIndex < 0) {
        return;
      }

      const nextIndex = selectedIndex + direction;
      if (nextIndex < 0 || nextIndex >= orderedCategories.length) {
        return;
      }

      const nextCategories = [...orderedCategories];
      const [movingCategory] = nextCategories.splice(selectedIndex, 1);
      nextCategories.splice(nextIndex, 0, movingCategory);
      setOrderedCategories(nextCategories);
      listScrollRef.current?.scrollTo({
        animated: true,
        y: resolveCategoryScrollY(nextIndex, direction, listViewportHeightRef.current),
      });
    },
    [orderedCategories, selectedIndex],
  );

  const saveCategoryOrder = useCallback(() => {
    onChangeOrder(orderedCategories);
    onClose();
  }, [onChangeOrder, onClose, orderedCategories]);

  const closeWithoutSaving = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleRequestClose = useCallback(() => {
    closeWithoutSaving();
  }, [closeWithoutSaving]);

  const handlePressBackdrop = useCallback(() => {
    closeWithoutSaving();
  }, [closeWithoutSaving]);

  const handlePressClose = useCallback(() => {
    closeWithoutSaving();
  }, [closeWithoutSaving]);

  const handlePressSave = useCallback(() => {
    saveCategoryOrder();
  }, [saveCategoryOrder]);

  const handlePressMoveUp = useCallback(() => {
    moveSelectedCategory(-1);
  }, [moveSelectedCategory]);

  const handlePressMoveDown = useCallback(() => {
    moveSelectedCategory(1);
  }, [moveSelectedCategory]);

  const selectCategory = useCallback((categoryId: string) => {
    setSelectedCategoryId(categoryId);
  }, []);

  if (!isOpen) {
    return null;
  }

  return (
    <Modal animationType="fade" onRequestClose={handleRequestClose} transparent visible>
      <View style={styles.overlay}>
        <Pressable onPress={handlePressBackdrop} style={styles.backdrop} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{CategoryCustomizerCopy.manageModalTitle}</Text>
            <Pressable onPress={handlePressClose}>
              <Text style={styles.closeText}>{CommonActionCopy.close}</Text>
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={styles.listContent}
            onLayout={(event) => {
              listViewportHeightRef.current = event.nativeEvent.layout.height;
            }}
            ref={listScrollRef}
            showsVerticalScrollIndicator
          >
            {orderedCategories.map((category) => (
              <CategoryManageRow
                category={category}
                isSelected={category.id === selectedCategoryId}
                key={category.id}
                onPress={() => selectCategory(category.id)}
              />
            ))}
          </ScrollView>
          <View style={styles.moveActionRow}>
            <CategoryMoveButton
              disabled={!canMoveUp}
              iconName="arrow-up"
              label={CategoryCustomizerCopy.moveUpAction}
              onPress={handlePressMoveUp}
            />
            <CategoryMoveButton
              disabled={!canMoveDown}
              iconName="arrow-down"
              label={CategoryCustomizerCopy.moveDownAction}
              onPress={handlePressMoveDown}
            />
          </View>
          <Pressable
            disabled={!canSave}
            onPress={handlePressSave}
            style={[styles.saveButton, !canSave ? styles.disabledSaveButton : null]}
          >
            <Text style={[styles.saveButtonText, !canSave ? styles.disabledSaveButtonText : null]}>
              {CommonActionCopy.save}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function resolveCategoryScrollY(
  categoryIndex: number,
  direction: -1 | 1,
  viewportHeight: number,
): number {
  const rowSpan = CATEGORY_MANAGE_ROW_HEIGHT + CATEGORY_MANAGE_ROW_GAP;
  if (direction > 0 || viewportHeight <= 0) {
    return categoryIndex * rowSpan;
  }

  const rowBottomWithMargin = categoryIndex * rowSpan + CATEGORY_MANAGE_ROW_HEIGHT + rowSpan;
  return Math.max(0, rowBottomWithMargin - viewportHeight);
}

function areCategoryOrdersEqual(
  currentCategories: readonly CategoryDefinition[],
  nextCategories: readonly CategoryDefinition[],
): boolean {
  if (currentCategories.length !== nextCategories.length) {
    return false;
  }

  return currentCategories.every((category, index) => category.id === nextCategories[index]?.id);
}

function CategoryManageRow({
  category,
  isSelected,
  onPress,
}: {
  category: CategoryDefinition;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.row, isSelected ? styles.selectedRow : null]}>
      <View style={styles.categoryMeta}>
        <Feather
          color={isSelected ? AppColors.primary : AppColors.mutedText}
          name={category.iconName}
          size={CATEGORY_MANAGE_ROW_ICON_SIZE}
        />
        <Text
          numberOfLines={1}
          style={[styles.categoryLabel, isSelected ? styles.selectedCategoryLabel : null]}
        >
          {category.label}
        </Text>
      </View>
    </Pressable>
  );
}

function CategoryMoveButton({
  disabled,
  iconName,
  label,
  onPress,
}: {
  disabled: boolean;
  iconName: "arrow-down" | "arrow-up";
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[styles.moveButton, disabled ? styles.disabledMoveButton : null]}
    >
      <Feather
        color={disabled ? AppColors.mutedText : AppColors.inverseText}
        name={iconName}
        size={CATEGORY_MANAGE_MOVE_BUTTON_ICON_SIZE}
      />
      <Text style={[styles.moveButtonText, disabled ? styles.disabledMoveButtonText : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: AppColors.overlay,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    marginHorizontal: 16,
    maxHeight: CATEGORY_MANAGE_MODAL_MAX_HEIGHT,
    padding: 16,
    gap: 14,
    borderRadius: AppLayout.cardRadius,
    backgroundColor: AppColors.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    color: AppColors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  closeText: {
    color: AppColors.mutedText,
    fontSize: 13,
    fontWeight: "700",
  },
  listContent: {
    gap: CATEGORY_MANAGE_ROW_GAP,
  },
  row: {
    height: CATEGORY_MANAGE_ROW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 14,
    backgroundColor: AppColors.background,
  },
  selectedRow: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.surfaceStrong,
  },
  categoryMeta: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryLabel: {
    flex: 1,
    color: AppColors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  selectedCategoryLabel: {
    color: AppColors.primary,
  },
  moveActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  moveButton: {
    flex: 1,
    minHeight: CATEGORY_MANAGE_ACTION_BUTTON_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    backgroundColor: AppColors.primary,
  },
  disabledMoveButton: {
    backgroundColor: AppColors.surfaceStrong,
  },
  moveButtonText: {
    color: AppColors.inverseText,
    fontSize: 14,
    fontWeight: "800",
  },
  disabledMoveButtonText: {
    color: AppColors.mutedText,
  },
  saveButton: {
    minHeight: CATEGORY_MANAGE_ACTION_BUTTON_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: AppColors.primary,
  },
  disabledSaveButton: {
    backgroundColor: AppColors.surfaceStrong,
  },
  saveButtonText: {
    color: AppColors.inverseText,
    fontSize: 14,
    fontWeight: "800",
  },
  disabledSaveButtonText: {
    color: AppColors.mutedText,
  },
});
