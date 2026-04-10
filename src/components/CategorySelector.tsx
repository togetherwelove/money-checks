import { StyleSheet, Text, View } from "react-native";

import { useMemo, useRef, useState } from "react";
import { CATEGORY_GRID_GAP } from "../constants/categorySelector";
import { FormLabelTextStyle } from "../constants/uiStyles";
import { useCategoryGridDrag } from "../hooks/useCategoryGridDrag";
import { useCategoryOrder } from "../hooks/useCategoryOrder";
import { useCustomCategories } from "../hooks/useCustomCategories";
import { resolveCategoryGridHeight, resolveCategoryGridPosition } from "../lib/categoryGrid";
import { mergeCustomCategories, sortCustomCategoriesByVisibleOrder } from "../lib/customCategories";
import type { CategoryDefinition } from "../types/category";
import type { LedgerEntryType } from "../types/ledger";
import { CategoryAddGridItem } from "./categorySelector/CategoryAddGridItem";
import { CategoryCustomizerModal } from "./categorySelector/CategoryCustomizerModal";
import { CategoryGridItem } from "./categorySelector/CategoryGridItem";

type CategorySelectorProps = {
  categories: readonly CategoryDefinition[];
  entryType: LedgerEntryType;
  onDraggingChange?: (isDragging: boolean) => void;
  selectedCategory: string;
  title: string;
  onSelectCategory: (category: string) => void;
};

export function CategorySelector({
  categories,
  entryType,
  onDraggingChange,
  selectedCategory,
  title,
  onSelectCategory,
}: CategorySelectorProps) {
  const optionsRef = useRef<View>(null);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const {
    customCategories,
    hiddenSystemCategoryIds,
    saveCustomCategories,
    saveHiddenSystemCategoryIds,
  } = useCustomCategories(entryType);
  const visibleBaseCategories = useMemo(
    () => categories.filter((category) => !hiddenSystemCategoryIds.includes(category.id)),
    [categories, hiddenSystemCategoryIds],
  );
  const mergedCategories = useMemo(
    () => mergeCustomCategories(visibleBaseCategories, customCategories),
    [customCategories, visibleBaseCategories],
  );
  const { commitOrderedCategories, orderedCategories, replaceOrderedCategories, saveCurrentOrder } =
    useCategoryOrder(entryType, mergedCategories);
  const {
    cellSize,
    columns,
    draggingCategoryId,
    getAnimatedPosition,
    handleContainerLayout,
    handleDragEnd,
    handleDragMove,
    handleDragStart,
  } = useCategoryGridDrag({
    onDraggingChange,
    orderedCategories,
    replaceOrderedCategories,
    saveCurrentOrder,
  });

  const addButtonPosition = resolveCategoryGridPosition(
    orderedCategories.length,
    cellSize,
    columns,
  );
  const gridHeight = resolveCategoryGridHeight(orderedCategories.length + 1, cellSize, columns);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View
        onLayout={(event) =>
          handleContainerLayout(optionsRef.current, event.nativeEvent.layout.width)
        }
        ref={optionsRef}
        style={[styles.options, { height: gridHeight }]}
      >
        {orderedCategories.map((category) => (
          <CategoryGridItem
            animatedPosition={getAnimatedPosition(category.id)}
            category={category}
            cellSize={cellSize}
            isActive={selectedCategory === category.label}
            isDragging={draggingCategoryId === category.id}
            key={category.id}
            onDragEnd={handleDragEnd}
            onDragMove={handleDragMove}
            onDragStart={handleDragStart}
            onPressCategory={(nextCategory) => onSelectCategory(nextCategory.label)}
          />
        ))}
        {cellSize > 0 ? (
          <CategoryAddGridItem
            cellSize={cellSize}
            left={addButtonPosition.x}
            onPress={() => setIsCustomizerOpen(true)}
            top={addButtonPosition.y}
          />
        ) : null}
      </View>
      <CategoryCustomizerModal
        categories={orderedCategories}
        baseCategories={categories}
        entryType={entryType}
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        onSaveCategories={(nextCategories) => {
          const nextCustomCategories = nextCategories.filter(
            (category) => category.source === "custom",
          );
          const nextHiddenSystemCategoryIds = categories
            .filter((category) => category.source === "system")
            .map((category) => category.id)
            .filter((categoryId) => !nextCategories.some((category) => category.id === categoryId));
          const previousSelectedCustomCategory = customCategories.find(
            (category) => category.label === selectedCategory,
          );
          saveCustomCategories(
            sortCustomCategoriesByVisibleOrder(nextCustomCategories, nextCategories),
          );
          saveHiddenSystemCategoryIds(nextHiddenSystemCategoryIds);
          commitOrderedCategories(nextCategories);

          if (previousSelectedCustomCategory) {
            const nextSelectedCustomCategory = nextCategories.find(
              (category) => category.id === previousSelectedCustomCategory.id,
            );
            if (nextSelectedCustomCategory?.label !== selectedCategory) {
              if (nextSelectedCustomCategory) {
                onSelectCategory(nextSelectedCustomCategory.label);
                return;
              }

              if (nextCategories[0]) {
                onSelectCategory(nextCategories[0].label);
              }
              return;
            }
          }

          const selectedCategoryStillExists = nextCategories.some(
            (category) => category.label === selectedCategory,
          );
          if (!selectedCategoryStillExists && nextCategories[0]) {
            onSelectCategory(nextCategories[0].label);
            return;
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  title: FormLabelTextStyle,
  options: {
    position: "relative",
    width: "100%",
    marginTop: CATEGORY_GRID_GAP,
  },
});
