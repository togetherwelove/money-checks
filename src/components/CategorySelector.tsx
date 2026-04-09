import { StyleSheet, Text, View } from "react-native";

import { useRef } from "react";
import { CATEGORY_GRID_GAP } from "../constants/categorySelector";
import { FormLabelTextStyle } from "../constants/uiStyles";
import { useCategoryGridDrag } from "../hooks/useCategoryGridDrag";
import { useCategoryOrder } from "../hooks/useCategoryOrder";
import type { LedgerEntryType } from "../types/ledger";
import { CategoryGridItem } from "./categorySelector/CategoryGridItem";

type CategorySelectorProps = {
  categories: readonly string[];
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
  const { orderedCategories, replaceOrderedCategories, saveCurrentOrder } = useCategoryOrder(
    entryType,
    categories,
  );
  const {
    cellSize,
    containerHeight,
    draggingCategory,
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View
        onLayout={(event) =>
          handleContainerLayout(optionsRef.current, event.nativeEvent.layout.width)
        }
        ref={optionsRef}
        style={[styles.options, { height: containerHeight }]}
      >
        {orderedCategories.map((category) => (
          <CategoryGridItem
            animatedPosition={getAnimatedPosition(category)}
            category={category}
            cellSize={cellSize}
            isActive={selectedCategory === category}
            isDragging={draggingCategory === category}
            key={category}
            onDragEnd={handleDragEnd}
            onDragMove={handleDragMove}
            onDragStart={handleDragStart}
            onPressCategory={onSelectCategory}
          />
        ))}
      </View>
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
