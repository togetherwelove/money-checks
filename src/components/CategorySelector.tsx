import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import {
  CUSTOM_CATEGORY_DEFAULT_ICON,
  CategoryContextMenuCopy,
  CategoryCustomizerCopy,
} from "../constants/categoryCustomizer";
import {
  CATEGORY_CONTEXT_MENU_ITEM_HEIGHT,
  CATEGORY_CONTEXT_MENU_OFFSET,
  CATEGORY_CONTEXT_MENU_TAIL_SIZE,
  CATEGORY_CONTEXT_MENU_WIDTH,
  CATEGORY_GRID_GAP,
} from "../constants/categorySelector";
import { AppColors } from "../constants/colors";
import { CommonActionCopy } from "../constants/commonActions";
import { FormLabelTextStyle } from "../constants/uiStyles";
import { useCustomCategories } from "../hooks/useCustomCategories";
import {
  resolveCategoryGridHeight,
  resolveCategoryGridMetrics,
  resolveCategoryGridPosition,
} from "../lib/categoryGrid";
import {
  createCustomCategory,
  mergeCustomCategories,
  normalizeCustomCategoryLabel,
  resolveCustomCategoryError,
  sortCategoriesByOrderIds,
} from "../lib/customCategories";
import type { CategoryDefinition, CategoryIconName } from "../types/category";
import type { LedgerEntryType } from "../types/ledger";
import { CategoryAddGridItem } from "./categorySelector/CategoryAddGridItem";
import { CategoryCreateModal } from "./categorySelector/CategoryCreateModal";
import { CategoryGridItem } from "./categorySelector/CategoryGridItem";
import { CategoryManageModal } from "./categorySelector/CategoryManageModal";

type CategorySelectorProps = {
  bookId?: string | null;
  categories: readonly CategoryDefinition[];
  entryType: LedgerEntryType;
  selectedCategoryId: string;
  title: string;
  onSelectCategory: (category: CategoryDefinition | null) => void;
};

export function CategorySelector({
  bookId = null,
  categories,
  entryType,
  selectedCategoryId,
  title,
  onSelectCategory,
}: CategorySelectorProps) {
  const [gridWidth, setGridWidth] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDefinition | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    category: CategoryDefinition;
    left: number;
    top: number;
  } | null>(null);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [newCategoryIconName, setNewCategoryIconName] = useState<CategoryIconName>(
    CUSTOM_CATEGORY_DEFAULT_ICON,
  );
  const [newCategoryError, setNewCategoryError] = useState<string | null>(null);
  const {
    categoryOrderIds,
    customCategories,
    hiddenSystemCategoryIds,
    systemCategoryIconOverrides,
    systemCategoryLabelOverrides,
    saveCategoryOrderIds,
    saveCustomCategories,
    saveHiddenSystemCategoryIds,
    saveSystemCategoryCustomizations,
  } = useCustomCategories(entryType, bookId);
  const overriddenBaseCategories = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        iconName: systemCategoryIconOverrides[category.id] ?? category.iconName,
        label: systemCategoryLabelOverrides[category.id] ?? category.label,
      })),
    [categories, systemCategoryIconOverrides, systemCategoryLabelOverrides],
  );
  const visibleBaseCategories = useMemo(
    () =>
      overriddenBaseCategories.filter((category) => !hiddenSystemCategoryIds.includes(category.id)),
    [hiddenSystemCategoryIds, overriddenBaseCategories],
  );
  const displayedCategories = useMemo(
    () =>
      sortCategoriesByOrderIds(
        mergeCustomCategories(visibleBaseCategories, customCategories),
        categoryOrderIds,
      ),
    [categoryOrderIds, customCategories, visibleBaseCategories],
  );
  const { cellSize, columns } = resolveCategoryGridMetrics(gridWidth);
  const addButtonPosition = resolveCategoryGridPosition(
    displayedCategories.length,
    cellSize,
    columns,
  );
  const gridHeight = resolveCategoryGridHeight(displayedCategories.length + 1, cellSize, columns);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <Pressable onPress={openCategoryManageModal}>
          <Text style={styles.manageAction}>{CategoryCustomizerCopy.manageAction}</Text>
        </Pressable>
      </View>
      <View
        onLayout={(event) => {
          setGridWidth(event.nativeEvent.layout.width);
        }}
        style={[styles.options, { height: gridHeight }]}
      >
        {displayedCategories.map((category, index) => {
          const position = resolveCategoryGridPosition(index, cellSize, columns);
          return (
            <CategoryGridItem
              category={category}
              cellSize={cellSize}
              isActive={selectedCategoryId === category.id}
              key={category.id}
              left={position.x}
              onLongPressCategory={() => openCategoryContextMenu(category, position.x, position.y)}
              onPressCategory={selectCategory}
              top={position.y}
            />
          );
        })}
        {cellSize > 0 ? (
          <CategoryAddGridItem
            cellSize={cellSize}
            left={addButtonPosition.x}
            onPress={startCategoryCreation}
            top={addButtonPosition.y}
          />
        ) : null}
      </View>
      <CategoryCreateModal
        actionLabel={editingCategory ? CommonActionCopy.save : undefined}
        errorMessage={newCategoryError}
        iconName={newCategoryIconName}
        isOpen={isCreateModalOpen}
        label={newCategoryLabel}
        title={editingCategory ? CategoryContextMenuCopy.editModalTitle : undefined}
        onCancel={cancelCategoryCreation}
        onChangeIcon={setNewCategoryIconName}
        onChangeLabel={(label) => {
          setNewCategoryLabel(label);
          setNewCategoryError(null);
        }}
        onSubmit={submitCategoryForm}
      />
      <CategoryManageModal
        categories={displayedCategories}
        isOpen={isManageModalOpen}
        onChangeOrder={saveCategoryOrder}
        onClose={() => setIsManageModalOpen(false)}
      />
      {contextMenu ? (
        <Pressable onPress={closeCategoryContextMenu} style={styles.contextOverlay}>
          <View
            style={[
              styles.contextMenu,
              {
                left: contextMenu.left,
                top: contextMenu.top,
              },
            ]}
          >
            <Pressable onPress={editContextCategory} style={styles.contextMenuItem}>
              <Text style={styles.contextMenuText}>{CategoryContextMenuCopy.editAction}</Text>
            </Pressable>
            <Pressable onPress={deleteContextCategory} style={styles.contextMenuItem}>
              <Text style={[styles.contextMenuText, styles.deleteContextMenuText]}>
                {CategoryCustomizerCopy.deleteAction}
              </Text>
            </Pressable>
            <View style={styles.contextMenuTailBorder} />
            <View style={styles.contextMenuTailFill} />
          </View>
        </Pressable>
      ) : null}
    </View>
  );

  function submitCategoryForm() {
    if (editingCategory) {
      updateCategory();
      return;
    }

    createCategory();
  }

  function createCategory() {
    const nextLabel = normalizeCustomCategoryLabel(newCategoryLabel);
    const nextCategory: CategoryDefinition = {
      ...createCustomCategory(entryType, customCategories.length + 1),
      iconName: newCategoryIconName,
      label: nextLabel,
    };
    const nextCustomCategories = [...customCategories, nextCategory];
    const errorMessage = resolveCustomCategoryError(overriddenBaseCategories, nextCustomCategories);

    if (errorMessage) {
      setNewCategoryError(errorMessage);
      return;
    }

    saveCustomCategories(nextCustomCategories);
    onSelectCategory(nextCategory);
    resetCategoryCreationState();
  }

  function updateSystemCategory(category: CategoryDefinition) {
    const nextLabel = normalizeCustomCategoryLabel(newCategoryLabel);
    const nextCategory: CategoryDefinition = {
      ...category,
      iconName: newCategoryIconName,
      label: nextLabel,
    };
    const nextDisplayedCategories = displayedCategories.map((displayedCategory) =>
      displayedCategory.id === category.id ? nextCategory : displayedCategory,
    );
    const errorMessage = resolveCustomCategoryError([], nextDisplayedCategories);

    if (errorMessage) {
      setNewCategoryError(errorMessage);
      return;
    }

    saveSystemCategoryCustomizations({
      hiddenSystemCategoryIds,
      systemCategoryIconOverrides: {
        ...systemCategoryIconOverrides,
        [category.id]: newCategoryIconName,
      },
      systemCategoryLabelOverrides: {
        ...systemCategoryLabelOverrides,
        [category.id]: nextLabel,
      },
    });
    if (selectedCategoryId === category.id) {
      onSelectCategory(nextCategory);
    }
    resetCategoryCreationState();
  }

  function selectCategory(nextCategory: CategoryDefinition) {
    setIsCreateModalOpen(false);
    closeCategoryContextMenu();
    onSelectCategory(nextCategory);
  }

  function updateCategory() {
    if (!editingCategory) {
      return;
    }

    if (editingCategory.source === "system") {
      updateSystemCategory(editingCategory);
      return;
    }

    const nextLabel = normalizeCustomCategoryLabel(newCategoryLabel);
    const nextCustomCategories = customCategories.map((customCategory) =>
      customCategory.id === editingCategory.id
        ? {
            ...customCategory,
            iconName: newCategoryIconName,
            label: nextLabel,
          }
        : customCategory,
    );
    const errorMessage = resolveCustomCategoryError(overriddenBaseCategories, nextCustomCategories);

    if (errorMessage) {
      setNewCategoryError(errorMessage);
      return;
    }

    const nextCategory = nextCustomCategories.find(
      (category) => category.id === editingCategory.id,
    );
    saveCustomCategories(nextCustomCategories);
    if (selectedCategoryId === editingCategory.id && nextCategory) {
      onSelectCategory(nextCategory);
    }
    resetCategoryCreationState();
  }

  function openCategoryContextMenu(category: CategoryDefinition, left: number, top: number) {
    const menuHeight = CATEGORY_CONTEXT_MENU_ITEM_HEIGHT * 2;
    const menuLeft = Math.min(
      Math.max(0, left + cellSize / 2 - CATEGORY_CONTEXT_MENU_WIDTH / 2),
      Math.max(0, gridWidth - CATEGORY_CONTEXT_MENU_WIDTH),
    );
    const menuTop = Math.max(0, top - menuHeight - CATEGORY_CONTEXT_MENU_OFFSET);

    setIsCreateModalOpen(false);
    setContextMenu({
      category,
      left: menuLeft,
      top: menuTop,
    });
  }

  function openCategoryManageModal() {
    setIsCreateModalOpen(false);
    closeCategoryContextMenu();
    setIsManageModalOpen(true);
  }

  function saveCategoryOrder(nextCategories: CategoryDefinition[]) {
    saveCategoryOrderIds([...new Set(nextCategories.map((category) => category.id))]);
  }

  function closeCategoryContextMenu() {
    setContextMenu(null);
  }

  function editContextCategory() {
    const category = contextMenu?.category;
    if (!category) {
      return;
    }

    setEditingCategory(category);
    setNewCategoryLabel(category.label);
    setNewCategoryIconName(category.iconName);
    setNewCategoryError(null);
    setIsCreateModalOpen(true);
    closeCategoryContextMenu();
  }

  function deleteContextCategory() {
    const category = contextMenu?.category;
    if (!category) {
      return;
    }

    closeCategoryContextMenu();
    Alert.alert(
      CategoryContextMenuCopy.deleteConfirmTitle,
      CategoryContextMenuCopy.deleteConfirmMessage,
      [
        {
          style: "cancel",
          text: CommonActionCopy.cancel,
        },
        {
          onPress: () => deleteCategory(category),
          style: "destructive",
          text: CategoryCustomizerCopy.deleteAction,
        },
      ],
    );
  }

  function deleteCategory(category: CategoryDefinition) {
    if (category.source === "custom") {
      saveCustomCategories(
        customCategories.filter((customCategory) => customCategory.id !== category.id),
      );
    } else {
      saveHiddenSystemCategoryIds([...new Set([...hiddenSystemCategoryIds, category.id])]);
    }

    if (selectedCategoryId === category.id) {
      onSelectCategory(null);
    }
  }

  function startCategoryCreation() {
    resetCategoryCreationState();
    closeCategoryContextMenu();
    setIsCreateModalOpen(true);
  }

  function cancelCategoryCreation() {
    resetCategoryCreationState();
  }

  function resetCategoryCreationState() {
    setIsCreateModalOpen(false);
    setEditingCategory(null);
    setNewCategoryLabel("");
    setNewCategoryIconName(CUSTOM_CATEGORY_DEFAULT_ICON);
    setNewCategoryError(null);
  }
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  title: FormLabelTextStyle,
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  manageAction: {
    color: AppColors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  options: {
    position: "relative",
    width: "100%",
    marginTop: CATEGORY_GRID_GAP,
  },
  contextOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  contextMenu: {
    position: "absolute",
    width: CATEGORY_CONTEXT_MENU_WIDTH,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 12,
    backgroundColor: AppColors.surface,
    shadowColor: AppColors.calendarShadow,
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 5,
  },
  contextMenuTailBorder: {
    position: "absolute",
    bottom: -CATEGORY_CONTEXT_MENU_TAIL_SIZE,
    left: CATEGORY_CONTEXT_MENU_WIDTH / 2 - CATEGORY_CONTEXT_MENU_TAIL_SIZE,
    width: 0,
    height: 0,
    borderLeftWidth: CATEGORY_CONTEXT_MENU_TAIL_SIZE,
    borderRightWidth: CATEGORY_CONTEXT_MENU_TAIL_SIZE,
    borderTopWidth: CATEGORY_CONTEXT_MENU_TAIL_SIZE,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: AppColors.border,
  },
  contextMenuTailFill: {
    position: "absolute",
    bottom: -CATEGORY_CONTEXT_MENU_TAIL_SIZE + 1,
    left: CATEGORY_CONTEXT_MENU_WIDTH / 2 - CATEGORY_CONTEXT_MENU_TAIL_SIZE + 1,
    width: 0,
    height: 0,
    borderLeftWidth: CATEGORY_CONTEXT_MENU_TAIL_SIZE - 1,
    borderRightWidth: CATEGORY_CONTEXT_MENU_TAIL_SIZE - 1,
    borderTopWidth: CATEGORY_CONTEXT_MENU_TAIL_SIZE - 1,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: AppColors.surface,
  },
  contextMenuItem: {
    height: CATEGORY_CONTEXT_MENU_ITEM_HEIGHT,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  contextMenuText: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  deleteContextMenuText: {
    color: AppColors.expense,
  },
});
