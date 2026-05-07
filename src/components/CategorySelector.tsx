import { type LayoutRectangle, StyleSheet, Text, View } from "react-native";

import { useMemo, useRef, useState } from "react";
import { CUSTOM_CATEGORY_DEFAULT_ICON } from "../constants/categoryCustomizer";
import {
  CATEGORY_GRID_GAP,
  CATEGORY_INLINE_ICON_PICKER_ANCHOR_GAP,
  CATEGORY_INLINE_ICON_PICKER_ARROW_SIZE,
  CATEGORY_INLINE_ICON_PICKER_HEIGHT,
  CATEGORY_INLINE_ICON_PICKER_WIDTH,
} from "../constants/categorySelector";
import { FormLabelTextStyle } from "../constants/uiStyles";
import { useCategoryGridDrag } from "../hooks/useCategoryGridDrag";
import { useCategoryOrder } from "../hooks/useCategoryOrder";
import { useCustomCategories } from "../hooks/useCustomCategories";
import { resolveCategoryGridHeight, resolveCategoryGridPosition } from "../lib/categoryGrid";
import {
  createCustomCategory,
  mergeCustomCategories,
  normalizeCustomCategoryLabel,
  resolveCustomCategoryError,
  sortCustomCategoriesByVisibleOrder,
} from "../lib/customCategories";
import type { CategoryDefinition, CategoryIconName } from "../types/category";
import type { LedgerEntryType } from "../types/ledger";
import { CategoryAddGridItem } from "./categorySelector/CategoryAddGridItem";
import { CategoryDeleteDropZone } from "./categorySelector/CategoryDeleteDropZone";
import { CategoryGridItem } from "./categorySelector/CategoryGridItem";
import { CategoryIconPickerList } from "./categorySelector/CategoryIconPickerList";
import { InlineCategoryCreator } from "./categorySelector/InlineCategoryCreator";

type CategorySelectorProps = {
  categories: readonly CategoryDefinition[];
  entryType: LedgerEntryType;
  onDraggingChange?: (isDragging: boolean) => void;
  selectedCategoryId: string;
  title: string;
  onSelectCategory: (category: CategoryDefinition | null) => void;
};

export function CategorySelector({
  categories,
  entryType,
  onDraggingChange,
  selectedCategoryId,
  title,
  onSelectCategory,
}: CategorySelectorProps) {
  const optionsRef = useRef<View>(null);
  const optionsBoundsRef = useRef<LayoutRectangle | null>(null);
  const deleteDropZoneRef = useRef<View>(null);
  const deleteDropZoneBoundsRef = useRef<LayoutRectangle | null>(null);
  const isSubmittingNewCategoryRef = useRef(false);
  const isInteractingWithIconPickerRef = useRef(false);
  const [gridWidth, setGridWidth] = useState(0);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [newCategoryIconName, setNewCategoryIconName] = useState<CategoryIconName>(
    CUSTOM_CATEGORY_DEFAULT_ICON,
  );
  const [newCategoryError, setNewCategoryError] = useState<string | null>(null);
  const [isDeleteDropZoneActive, setIsDeleteDropZoneActive] = useState(false);
  const {
    customCategories,
    hiddenSystemCategoryIds,
    systemCategoryIconOverrides,
    saveCustomCategories,
    saveHiddenSystemCategoryIds,
  } = useCustomCategories(entryType);
  const overriddenBaseCategories = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        iconName: systemCategoryIconOverrides[category.id] ?? category.iconName,
      })),
    [categories, systemCategoryIconOverrides],
  );
  const visibleBaseCategories = useMemo(
    () =>
      overriddenBaseCategories.filter((category) => !hiddenSystemCategoryIds.includes(category.id)),
    [hiddenSystemCategoryIds, overriddenBaseCategories],
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
    isReorderEnabled: false,
    onDeleteCategory: (categoryId) => {
      setIsDeleteDropZoneActive(false);
      deleteCategory(categoryId);
    },
    onDraggingChange,
    orderedCategories,
    replaceOrderedCategories,
    saveCurrentOrder,
    shouldDeleteCategory: isPointInDeleteDropZone,
  });

  const addButtonPosition = resolveCategoryGridPosition(
    orderedCategories.length,
    cellSize,
    columns,
  );
  const iconPickerLeft = resolveIconPickerLeft(addButtonPosition.x, cellSize, gridWidth);
  const iconPickerTop = Math.max(
    0,
    addButtonPosition.y -
      CATEGORY_INLINE_ICON_PICKER_ANCHOR_GAP -
      CATEGORY_INLINE_ICON_PICKER_HEIGHT,
  );
  const iconPickerArrowLeft =
    addButtonPosition.x + cellSize / 2 - iconPickerLeft - CATEGORY_INLINE_ICON_PICKER_ARROW_SIZE;
  const gridHeight = resolveCategoryGridHeight(orderedCategories.length + 1, cellSize, columns);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View
        onLayout={(event) => {
          setGridWidth(event.nativeEvent.layout.width);
          measureOptionsBounds();
          handleContainerLayout(optionsRef.current, event.nativeEvent.layout.width);
        }}
        onTouchStart={(event) => {
          if (!isAddingCategory) {
            return;
          }

          const { pageX, pageY } = event.nativeEvent;
          if (!isPointInInlineEditor(pageX, pageY)) {
            cancelInlineCategory();
          }
        }}
        ref={optionsRef}
        style={[styles.options, { height: gridHeight }]}
      >
        {orderedCategories.map((category) => {
          return (
            <CategoryGridItem
              animatedPosition={getAnimatedPosition(category.id)}
              category={category}
              cellSize={cellSize}
              isActive={selectedCategoryId === category.id}
              isDragging={draggingCategoryId === category.id}
              key={category.id}
              onDragEnd={handleDragEnd}
              onDragMove={(categoryId, pageX, pageY) => {
                setIsDeleteDropZoneActive(isPointInDeleteDropZone(pageX, pageY));
                handleDragMove(categoryId, pageX, pageY);
              }}
              onDragStart={handleDragStart}
              onPressCategory={selectCategory}
            />
          );
        })}
        {cellSize > 0 && isAddingCategory ? (
          <InlineCategoryCreator
            errorMessage={newCategoryError}
            height={cellSize}
            iconName={newCategoryIconName}
            label={newCategoryLabel}
            left={addButtonPosition.x}
            onChangeLabel={(label) => {
              setNewCategoryLabel(label);
              setNewCategoryError(null);
            }}
            onCancel={cancelInlineCategory}
            onPressIcon={handlePressInlineIcon}
            onPressInIcon={markIconPickerInteraction}
            onSubmit={createInlineCategory}
            top={addButtonPosition.y}
            width={cellSize}
          />
        ) : cellSize > 0 ? (
          <CategoryAddGridItem
            cellSize={cellSize}
            left={addButtonPosition.x}
            onPress={startInlineCategory}
            top={addButtonPosition.y}
          />
        ) : null}
        {cellSize > 0 && isAddingCategory && isIconPickerOpen ? (
          <CategoryIconPickerList
            activeIconName={newCategoryIconName}
            arrowLeft={iconPickerArrowLeft}
            left={iconPickerLeft}
            onPressIn={markIconPickerInteraction}
            onSelectIcon={(iconName) => {
              setNewCategoryIconName(iconName);
              setIsIconPickerOpen(false);
              releaseIconPickerInteraction();
            }}
            top={iconPickerTop}
            width={CATEGORY_INLINE_ICON_PICKER_WIDTH}
          />
        ) : null}
      </View>
      {draggingCategoryId ? (
        <View ref={deleteDropZoneRef} style={styles.deleteDropZoneWrapper}>
          <CategoryDeleteDropZone
            isActive={isDeleteDropZoneActive}
            onLayout={measureDeleteDropZone}
          />
        </View>
      ) : null}
    </View>
  );

  function createInlineCategory() {
    isSubmittingNewCategoryRef.current = true;
    const nextLabel = normalizeCustomCategoryLabel(newCategoryLabel);
    const nextCategory: CategoryDefinition = {
      ...createCustomCategory(entryType, customCategories.length + 1),
      iconName: newCategoryIconName,
      label: nextLabel,
    };
    const nextCustomCategories = [...customCategories, nextCategory];
    const errorMessage = resolveCustomCategoryError(categories, nextCustomCategories);

    if (errorMessage) {
      isSubmittingNewCategoryRef.current = false;
      setNewCategoryError(errorMessage);
      return;
    }

    const nextCategories = [...orderedCategories, nextCategory];
    saveCustomCategories(sortCustomCategoriesByVisibleOrder(nextCustomCategories, nextCategories));
    commitOrderedCategories(nextCategories);
    onSelectCategory(nextCategory);
    setIsAddingCategory(false);
    setIsIconPickerOpen(false);
    setNewCategoryLabel("");
    setNewCategoryIconName(CUSTOM_CATEGORY_DEFAULT_ICON);
    setNewCategoryError(null);
    isInteractingWithIconPickerRef.current = false;
    requestAnimationFrame(() => {
      isSubmittingNewCategoryRef.current = false;
    });
  }

  function selectCategory(nextCategory: CategoryDefinition) {
    if (selectedCategoryId === nextCategory.id) {
      clearSelectedCategory();
      return;
    }

    setIsAddingCategory(false);
    setIsIconPickerOpen(false);
    onSelectCategory(nextCategory);
  }

  function clearSelectedCategory() {
    onSelectCategory(null);
  }

  function startInlineCategory() {
    setIsAddingCategory(true);
    setIsIconPickerOpen(true);
  }

  function cancelInlineCategory() {
    if (isSubmittingNewCategoryRef.current || isInteractingWithIconPickerRef.current) {
      return;
    }

    setIsAddingCategory(false);
    setIsIconPickerOpen(false);
    setNewCategoryLabel("");
    setNewCategoryIconName(CUSTOM_CATEGORY_DEFAULT_ICON);
    setNewCategoryError(null);
    isInteractingWithIconPickerRef.current = false;
  }

  function markIconPickerInteraction() {
    isInteractingWithIconPickerRef.current = true;
  }

  function handlePressInlineIcon() {
    setIsIconPickerOpen((isOpen) => {
      return !isOpen;
    });
    releaseIconPickerInteraction();
  }

  function releaseIconPickerInteraction() {
    requestAnimationFrame(() => {
      isInteractingWithIconPickerRef.current = false;
    });
  }

  function deleteCategory(categoryId: string) {
    const deletingCategory = orderedCategories.find((category) => category.id === categoryId);

    if (!deletingCategory) {
      return;
    }

    const nextCategories = orderedCategories.filter((category) => category.id !== categoryId);

    if (deletingCategory.source === "system") {
      saveHiddenSystemCategoryIds([...new Set([...hiddenSystemCategoryIds, deletingCategory.id])]);
    } else {
      const nextCustomCategories = customCategories.filter(
        (category) => category.id !== deletingCategory.id,
      );
      saveCustomCategories(
        sortCustomCategoriesByVisibleOrder(nextCustomCategories, nextCategories),
      );
    }

    commitOrderedCategories(nextCategories);

    if (selectedCategoryId === deletingCategory.id) {
      onSelectCategory(nextCategories[0] ?? null);
    }
  }

  function isPointInDeleteDropZone(pageX: number, pageY: number): boolean {
    const bounds = deleteDropZoneBoundsRef.current;
    return Boolean(
      bounds &&
        pageX >= bounds.x &&
        pageX <= bounds.x + bounds.width &&
        pageY >= bounds.y &&
        pageY <= bounds.y + bounds.height,
    );
  }

  function measureDeleteDropZone() {
    deleteDropZoneRef.current?.measureInWindow((x, y, width, height) => {
      deleteDropZoneBoundsRef.current = { height, width, x, y };
    });
  }

  function measureOptionsBounds() {
    optionsRef.current?.measureInWindow((x, y, width, height) => {
      optionsBoundsRef.current = { height, width, x, y };
    });
  }

  function isPointInInlineEditor(pageX: number, pageY: number): boolean {
    const bounds = optionsBoundsRef.current;
    if (!bounds || cellSize <= 0) {
      return false;
    }

    const localX = pageX - bounds.x;
    const localY = pageY - bounds.y;
    const isInCreator =
      localX >= addButtonPosition.x &&
      localX <= addButtonPosition.x + cellSize &&
      localY >= addButtonPosition.y &&
      localY <= addButtonPosition.y + cellSize;
    const isInIconPicker =
      isIconPickerOpen &&
      localX >= iconPickerLeft &&
      localX <= iconPickerLeft + CATEGORY_INLINE_ICON_PICKER_WIDTH &&
      localY >= iconPickerTop &&
      localY <= iconPickerTop + CATEGORY_INLINE_ICON_PICKER_HEIGHT;

    return isInCreator || isInIconPicker;
  }
}

function resolveIconPickerLeft(anchorLeft: number, anchorWidth: number, containerWidth: number) {
  const centeredLeft = anchorLeft + anchorWidth / 2 - CATEGORY_INLINE_ICON_PICKER_WIDTH / 2;
  return Math.min(
    Math.max(centeredLeft, 0),
    Math.max(containerWidth - CATEGORY_INLINE_ICON_PICKER_WIDTH, 0),
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
  deleteDropZoneWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },
});
